use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct GitRef {
    pub name: String,
    pub ref_type: String, // "branch", "tag", or "commit"
}

#[derive(Debug, Serialize)]
pub struct GitError {
    pub message: String,
}

impl From<std::io::Error> for GitError {
    fn from(err: std::io::Error) -> Self {
        GitError {
            message: err.to_string(),
        }
    }
}

impl From<String> for GitError {
    fn from(message: String) -> Self {
        GitError { message }
    }
}

/// Check if a directory is a valid Git repository
pub fn is_git_repo(path: &Path) -> bool {
    path.join(".git").exists()
}

/// Get the current branch name
pub fn get_current_branch(repo_path: &Path) -> Result<String, GitError> {
    let output = Command::new("git")
        .args(["rev-parse", "--abbrev-ref", "HEAD"])
        .current_dir(repo_path)
        .output()?;

    if output.status.success() {
        let branch = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(branch)
    } else {
        Err(GitError::from("Failed to get current branch".to_string()))
    }
}

/// List all local branches
pub fn list_branches(repo_path: &Path) -> Result<Vec<String>, GitError> {
    let output = Command::new("git")
        .args(["branch", "--format=%(refname:short)"])
        .current_dir(repo_path)
        .output()?;

    if output.status.success() {
        let branches: Vec<String> = String::from_utf8_lossy(&output.stdout)
            .lines()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        Ok(branches)
    } else {
        Err(GitError::from("Failed to list branches".to_string()))
    }
}

/// List all tags
pub fn list_tags(repo_path: &Path) -> Result<Vec<String>, GitError> {
    let output = Command::new("git")
        .args(["tag", "--list"])
        .current_dir(repo_path)
        .output()?;

    if output.status.success() {
        let tags: Vec<String> = String::from_utf8_lossy(&output.stdout)
            .lines()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        Ok(tags)
    } else {
        Err(GitError::from("Failed to list tags".to_string()))
    }
}

/// Validate if a commit hash exists
pub fn validate_commit(repo_path: &Path, commit: &str) -> Result<bool, GitError> {
    let output = Command::new("git")
        .args(["cat-file", "-t", commit])
        .current_dir(repo_path)
        .output()?;

    Ok(output.status.success())
}

/// Get file content from a specific Git ref (branch, tag, or commit)
pub fn get_file_at_ref(
    repo_path: &Path,
    git_ref: &str,
    file_path: &str,
) -> Result<Vec<u8>, GitError> {
    let file_spec = format!("{}:{}", git_ref, file_path);

    let output = Command::new("git")
        .args(["show", &file_spec])
        .current_dir(repo_path)
        .output()?;

    if output.status.success() {
        Ok(output.stdout)
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        Err(GitError::from(format!("Failed to get file: {}", error_msg)))
    }
}

/// Check if a file is a Git LFS pointer
pub fn is_lfs_pointer(content: &[u8]) -> bool {
    if let Ok(text) = std::str::from_utf8(content) {
        text.starts_with("version https://git-lfs.github.com/spec")
    } else {
        false
    }
}

/// Extract OID from LFS pointer content
pub fn extract_lfs_oid(content: &[u8]) -> Option<String> {
    if let Ok(text) = std::str::from_utf8(content) {
        for line in text.lines() {
            if line.starts_with("oid sha256:") {
                return Some(line.replace("oid sha256:", "").trim().to_string());
            }
        }
    }
    None
}

/// Fetch LFS file by pulling specific path
pub fn fetch_lfs_file(repo_path: &Path, file_path: &str) -> Result<(), GitError> {
    let output = Command::new("git")
        .args(["lfs", "pull", "--include", file_path])
        .current_dir(repo_path)
        .output()?;

    if output.status.success() {
        Ok(())
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        Err(GitError::from(format!(
            "Failed to fetch LFS file: {}",
            error_msg
        )))
    }
}

/// Get LFS object path from OID
pub fn get_lfs_object_path(repo_path: &Path, oid: &str) -> PathBuf {
    if oid.len() >= 5 {
        let prefix = &oid[0..2];
        let suffix = &oid[2..4];
        repo_path
            .join(".git/lfs/objects")
            .join(prefix)
            .join(suffix)
            .join(oid)
    } else {
        repo_path.join(".git/lfs/objects").join(oid)
    }
}
