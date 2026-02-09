import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppStore } from '../stores/appStore';
import { Screenshot } from '../types';

export const useGitOperations = () => {
  const {
    setRepoPath,
    setCurrentBranch,
    setBranches,
    setTags,
    setScreenshots,
    setLoading,
    setError,
  } = useAppStore();

  const selectRepository = async () => {
    try {
      setLoading(true);
      setError(null);

      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Git Repository',
      });

      if (!selected) {
        setLoading(false);
        return;
      }

      const path = selected as string;

      // Validate it's a git repository
      const isValid = await invoke<boolean>('validate_repository', { path });

      if (!isValid) {
        setError('Selected directory is not a Git repository');
        setLoading(false);
        return;
      }

      setRepoPath(path);

      // Load git info in parallel
      const [branch, branches, tags, screenshots] = await Promise.all([
        invoke<string>('get_current_branch', { repoPath: path }),
        invoke<string[]>('list_branches', { repoPath: path }),
        invoke<string[]>('list_tags', { repoPath: path }),
        invoke<Screenshot[]>('scan_screenshots', { repoPath: path }),
      ]);

      setCurrentBranch(branch);
      setBranches(branches);
      setTags(tags);
      setScreenshots(screenshots);

      if (screenshots.length === 0) {
        setError('No screenshots found in this repository');
      }

      setLoading(false);
    } catch (error) {
      setError(String(error));
      setLoading(false);
    }
  };

  const validateCommitHash = async (repoPath: string, commit: string): Promise<boolean> => {
    try {
      return await invoke<boolean>('validate_commit', { repoPath, commit });
    } catch (error) {
      console.error('Error validating commit:', error);
      return false;
    }
  };

  const getFileAtRef = async (
    repoPath: string,
    gitRef: string,
    filePath: string
  ): Promise<string> => {
    return await invoke<string>('get_file_at_ref', {
      repoPath,
      gitRef,
      filePath,
    });
  };

  return {
    selectRepository,
    validateCommitHash,
    getFileAtRef,
  };
};
