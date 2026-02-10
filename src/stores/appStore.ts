import { create } from 'zustand';
import { AppState, Screenshot } from '../types';
import { imageCache } from '../utils/imageCache';

interface AppStore extends AppState {
  setRepoPath: (path: string) => void;
  setCurrentBranch: (branch: string) => void;
  setBranches: (branches: string[]) => void;
  setRemoteBranches: (remoteBranches: string[]) => void;
  setTags: (tags: string[]) => void;
  setScreenshots: (screenshots: Screenshot[]) => void;
  setSelectedScreenshot: (screenshot: Screenshot | null) => void;
  setBaseRef: (ref: string | null, type: 'branch' | 'tag' | 'commit' | null) => void;
  setCompareRef: (ref: string | null, type: 'branch' | 'tag' | 'commit' | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: AppState = {
  repoPath: null,
  currentBranch: null,
  branches: [],
  remoteBranches: [],
  tags: [],
  screenshots: [],
  selectedScreenshot: null,
  baseRef: null,
  baseRefType: null,
  compareRef: null,
  compareRefType: null,
  isLoading: false,
  error: null,
};

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  
  setRepoPath: (path) => {
    // Clear cache when switching repositories
    imageCache.clear();
    set({ repoPath: path });
  },
  setCurrentBranch: (branch) => set({ currentBranch: branch }),
  setBranches: (branches) => set({ branches }),
  setRemoteBranches: (remoteBranches) => set({ remoteBranches }),
  setTags: (tags) => set({ tags }),
  setScreenshots: (screenshots) => set({ screenshots }),
  setSelectedScreenshot: (screenshot) => set({ selectedScreenshot: screenshot }),
  setBaseRef: (ref, type) => set({ baseRef: ref, baseRefType: type }),
  setCompareRef: (ref, type) => set({ compareRef: ref, compareRefType: type }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => {
    // Clear cache when resetting
    imageCache.clear();
    set(initialState);
  },
}));
