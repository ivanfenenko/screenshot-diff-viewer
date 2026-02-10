import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppStore } from '../stores/appStore';
import { Store } from '@tauri-apps/plugin-store';

export const useGitOperations = () => {
  const {
    setRepoPath,
    setCurrentBranch,
    setBranches,
    setRemoteBranches,
    setTags,
    setBaseRef,
    setLoading,
    setError,
  } = useAppStore();

  const selectRepository = async (providedPath?: string) => {
    try {
      setLoading(true);
      setError(null);

      let path: string;

      if (providedPath) {
        // Use provided path (e.g., from persistent storage)
        path = providedPath;
      } else {
        // Show dialog to select directory
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Select Git Repository',
        });

        if (!selected) {
          setLoading(false);
          return;
        }

        path = selected as string;
      }

      // Validate it's a git repository
      const isValid = await invoke<boolean>('validate_repository', { path });

      if (!isValid) {
        setError('Selected directory is not a Git repository');
        setLoading(false);
        return;
      }

      setRepoPath(path);

      // Save to persistent storage
      const store = await Store.load('settings.json');
      await store.set('lastRepoPath', path);
      await store.save();

      // Load git info in parallel (local branches, remote branches, tags)
      const [branch, branches, remoteBranches, tags] = await Promise.all([
        invoke<string>('get_current_branch', { repoPath: path }),
        invoke<string[]>('list_branches', { repoPath: path }),
        invoke<string[]>('list_remote_branches', { repoPath: path }).catch(() => []),
        invoke<string[]>('list_tags', { repoPath: path }),
      ]);

      setCurrentBranch(branch);
      setBranches(branches);
      setRemoteBranches(remoteBranches);
      setTags(tags);
      
      // Set the current branch as the base ref by default
      // This will trigger screenshot loading in App.tsx
      setBaseRef(branch, 'branch');

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
