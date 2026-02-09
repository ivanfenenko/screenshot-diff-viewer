use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Screenshot {
    pub name: String,
    pub relative_path: String,
    pub absolute_path: String,
}

/// Search for screenshot directories in a repository
pub fn find_screenshot_dirs(repo_path: &Path) -> Vec<PathBuf> {
    let patterns = vec!["snapshots", "screenshots", "__snapshots__"];

    let mut found_dirs = Vec::new();

    for entry in WalkDir::new(repo_path)
        .max_depth(6)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_dir() {
            let dir_name = entry.file_name().to_string_lossy().to_lowercase();
            if patterns.iter().any(|p| dir_name.contains(p)) {
                found_dirs.push(entry.path().to_path_buf());
            }
        }
    }

    found_dirs
}

/// Scan a directory for PNG screenshots
pub fn scan_screenshots(dir_path: &Path, repo_path: &Path) -> Vec<Screenshot> {
    let mut screenshots = Vec::new();

    for entry in WalkDir::new(dir_path).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            if let Some(ext) = entry.path().extension() {
                if ext == "png" {
                    let absolute_path = entry.path().to_string_lossy().to_string();
                    let relative_path = entry
                        .path()
                        .strip_prefix(repo_path)
                        .unwrap_or(entry.path())
                        .to_string_lossy()
                        .to_string();

                    let name = entry.file_name().to_string_lossy().to_string();

                    screenshots.push(Screenshot {
                        name,
                        relative_path,
                        absolute_path,
                    });
                }
            }
        }
    }

    screenshots.sort_by(|a, b| a.name.cmp(&b.name));
    screenshots
}

/// Auto-detect and scan all screenshot directories in a repository
pub fn auto_scan_repository(repo_path: &Path) -> Vec<Screenshot> {
    let screenshot_dirs = find_screenshot_dirs(repo_path);

    let mut all_screenshots = Vec::new();
    for dir in screenshot_dirs {
        let screenshots = scan_screenshots(&dir, repo_path);
        all_screenshots.extend(screenshots);
    }

    // Remove duplicates by relative path
    all_screenshots.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    all_screenshots.dedup_by(|a, b| a.relative_path == b.relative_path);

    all_screenshots
}
