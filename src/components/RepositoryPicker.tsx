import { FolderOpen, Camera, Sparkles } from 'lucide-react';
import { useGitOperations } from '../hooks/useGitOperations';
import { useAppStore } from '../stores/appStore';

export const RepositoryPicker = () => {
  const { selectRepository } = useGitOperations();
  const { isLoading } = useAppStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center max-w-2xl px-8">
        {/* Icon with gradient background */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-3xl shadow-2xl">
            <Camera className="w-16 h-16 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* Title with gradient */}
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Paparazzi Compare
        </h1>
        
        <p className="text-lg text-slate-600 mb-4 leading-relaxed">
          Visual screenshot testing made easy
        </p>
        
        <p className="text-slate-500 mb-12 max-w-lg mx-auto">
          Compare Paparazzi screenshots across branches, tags, and commits with a beautiful side-by-side view
        </p>

        {/* Feature highlights */}
        <div className="flex items-center justify-center gap-6 mb-12 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Auto-detect</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Git LFS</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Side-by-side</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={selectRepository}
          disabled={isLoading}
          className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <span className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5" />
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Loading Repository...</span>
              </>
            ) : (
              <span>Open Repository</span>
            )}
          </span>
          {!isLoading && (
            <div className="absolute inset-0 bg-white rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
          )}
        </button>

        {/* Subtle hint */}
        <p className="mt-8 text-xs text-slate-400">
          Select any Git repository containing Paparazzi screenshots
        </p>
      </div>
    </div>
  );
};
