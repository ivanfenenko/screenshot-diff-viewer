export interface Screenshot {
  name: string;
  relative_path: string;
  absolute_path: string;
}

export interface AppState {
  repoPath: string | null;
  currentBranch: string | null;
  branches: string[];
  tags: string[];
  screenshots: Screenshot[];
  selectedScreenshot: Screenshot | null;
  compareRef: string | null;
  compareRefType: 'branch' | 'tag' | 'commit' | null;
  isLoading: boolean;
  error: string | null;
}
