mod git;
mod scanner;

use base64::{engine::general_purpose, Engine as _};
use scanner::Screenshot;
use std::path::Path;

#[tauri::command]
fn validate_repository(path: String) -> Result<bool, String> {
    let repo_path = Path::new(&path);
    Ok(git::is_git_repo(repo_path))
}

#[tauri::command]
fn get_current_branch(repo_path: String) -> Result<String, String> {
    git::get_current_branch(Path::new(&repo_path)).map_err(|e| e.message)
}

#[tauri::command]
fn list_branches(repo_path: String) -> Result<Vec<String>, String> {
    git::list_branches(Path::new(&repo_path)).map_err(|e| e.message)
}

#[tauri::command]
fn list_tags(repo_path: String) -> Result<Vec<String>, String> {
    git::list_tags(Path::new(&repo_path)).map_err(|e| e.message)
}

#[tauri::command]
fn validate_commit(repo_path: String, commit: String) -> Result<bool, String> {
    git::validate_commit(Path::new(&repo_path), &commit).map_err(|e| e.message)
}

#[tauri::command]
fn scan_screenshots(repo_path: String) -> Result<Vec<Screenshot>, String> {
    Ok(scanner::auto_scan_repository(Path::new(&repo_path)))
}

#[tauri::command]
fn scan_screenshots_at_ref(repo_path: String, git_ref: String) -> Result<Vec<Screenshot>, String> {
    let repo = Path::new(&repo_path);
    let mut screenshots = Vec::new();
    let mut seen = std::collections::HashSet::new();

    // Discovery: list full tree at ref and find all paths that look like screenshot tests
    // (e.g. app/src/test/snapshots/<flavor>/images/*.png, **/screenshots/**/*.png)
    match git::list_screenshot_pngs_at_ref(repo, &git_ref) {
        Ok(paths) => {
            for relative_path in paths {
                if seen.insert(relative_path.clone()) {
                    let name = relative_path
                        .split('/')
                        .last()
                        .unwrap_or(&relative_path)
                        .to_string();
                    let absolute_path = format!("{}/{}", repo_path, relative_path);
                    screenshots.push(Screenshot {
                        name,
                        relative_path,
                        absolute_path,
                    });
                }
            }
        }
        Err(_) => {}
    }

    // Fallback: fixed directories (Paparazzi-style flat layout)
    let directories = vec![
        "app/src/test/snapshots/images",
        "src/test/snapshots/images",
        "snapshots/images",
        "screenshots",
        "__snapshots__",
    ];

    for dir in directories {
        match git::list_files_at_ref(repo, &git_ref, dir) {
            Ok(files) => {
                for file_path in files {
                    let relative_path = format!("{}/{}", dir, file_path);
                    if seen.insert(relative_path.clone()) {
                        let name = file_path
                            .split('/')
                            .last()
                            .unwrap_or(&file_path)
                            .to_string();
                        let absolute_path = format!("{}/{}", repo_path, &relative_path);
                        screenshots.push(Screenshot {
                            name,
                            relative_path,
                            absolute_path,
                        });
                    }
                }
            }
            Err(_) => continue,
        }
    }

    screenshots.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    Ok(screenshots)
}

#[tauri::command]
fn get_file_at_ref(
    repo_path: String,
    git_ref: String,
    file_path: String,
) -> Result<String, String> {
    let content =
        git::get_file_at_ref(Path::new(&repo_path), &git_ref, &file_path).map_err(|e| e.message)?;

    // Check if it's an LFS pointer
    if git::is_lfs_pointer(&content) {
        if let Some(oid) = git::extract_lfs_oid(&content) {
            let lfs_path = git::get_lfs_object_path(Path::new(&repo_path), &oid);

            // If LFS object doesn't exist, try to fetch it
            if !lfs_path.exists() {
                git::fetch_lfs_file(Path::new(&repo_path), &file_path).map_err(|e| e.message)?;
            }

            // Read the actual LFS file
            if lfs_path.exists() {
                let lfs_content = std::fs::read(&lfs_path)
                    .map_err(|e| format!("Failed to read LFS file: {}", e))?;
                return Ok(general_purpose::STANDARD.encode(&lfs_content));
            }
        }
    }

    // Return base64 encoded content
    Ok(general_purpose::STANDARD.encode(&content))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            validate_repository,
            get_current_branch,
            list_branches,
            list_tags,
            validate_commit,
            scan_screenshots,
            scan_screenshots_at_ref,
            get_file_at_ref,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
