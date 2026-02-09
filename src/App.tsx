import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { useGitOperations } from './hooks/useGitOperations';
import { RepositoryPicker } from './components/RepositoryPicker';
import { ScreenshotList } from './components/ScreenshotList';
import { ComparisonView } from './components/ComparisonView';
import { BranchSelector } from './components/BranchSelector';
import { GitBranch, FolderOpen, Camera, CornerUpLeft } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { Screenshot } from './types';
import { Store } from '@tauri-apps/plugin-store';
import './App.css';

function App() {
  const { repoPath, currentBranch, baseRef, screenshots, error, reset, setScreenshots, setError } = useAppStore();
  const { selectRepository } = useGitOperations();

  // Extract repository name from path
  const repoName = repoPath ? repoPath.split('/').pop() : '';

  // Load last used repository on startup
  useEffect(() => {
    const loadLastRepo = async () => {
      try {
        const store = await Store.load('settings.json');
        const lastRepoPath = await store.get<string>('lastRepoPath');
        
        if (lastRepoPath && !repoPath) {
          console.log('[App] Loading last used repository:', lastRepoPath);
          // Validate that the repo still exists and is valid
          const isValid = await invoke<boolean>('validate_repository', { path: lastRepoPath });
          if (isValid) {
            await selectRepository(lastRepoPath);
          } else {
            console.log('[App] Last used repository is no longer valid');
            // Clear invalid path from storage
            await store.set('lastRepoPath', null);
            await store.save();
          }
        }
      } catch (error) {
        console.error('[App] Error loading last repository:', error);
      }
    };

    loadLastRepo();
  }, []);

  // Load screenshots when baseRef changes
  useEffect(() => {
    const loadScreenshots = async () => {
      if (!repoPath || !baseRef) {
        setScreenshots([]);
        return;
      }

      try {
        console.log('[App] Loading screenshots from baseRef:', baseRef);
        const shots = await invoke<Screenshot[]>('scan_screenshots_at_ref', {
          repoPath,
          gitRef: baseRef,
        });
        console.log('[App] Loaded screenshots:', shots.length);
        setScreenshots(shots);
        
        if (shots.length === 0) {
          setError(`No screenshots found in ${baseRef}`);
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('[App] Error loading screenshots:', err);
        setError(String(err));
        setScreenshots([]);
      }
    };

    loadScreenshots();
  }, [repoPath, baseRef]);

  if (!repoPath) {
    return <RepositoryPicker />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                <Camera className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Paparazzi Compare
                </h1>
              </div>
            </div>

            {/* Repository Info - Clickable to change repo */}
            <button
              onClick={reset}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg text-sm border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
              title="Click to change repository"
            >
              <FolderOpen className="w-4 h-4 text-slate-500 group-hover:text-slate-600" />
              <span className="font-semibold text-slate-700">{repoName}</span>
              <CornerUpLeft className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <BranchSelector mode="base" label="Base" />
            <BranchSelector mode="compare" label="Compare" />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200 px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-yellow-900 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {screenshots.length > 0 ? (
          <>
            <ScreenshotList />
            <ComparisonView />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Camera className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-700 font-semibold mb-2">No screenshots found</p>
              <p className="text-sm text-slate-500">
                This repository doesn't contain any Paparazzi screenshots in the standard directories
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;


