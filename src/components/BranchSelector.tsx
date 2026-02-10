import { useState } from 'react';
import { GitBranch, Tag, Hash, X, Check, ArrowRight } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { useGitOperations } from '../hooks/useGitOperations';

interface BranchSelectorProps {
  mode: 'base' | 'compare';
  label?: string;
}

export const BranchSelector = ({ mode, label }: BranchSelectorProps) => {
  const {
    currentBranch,
    branches,
    remoteBranches,
    tags,
    baseRef,
    baseRefType,
    compareRef,
    compareRefType,
    setBaseRef,
    setCompareRef,
    repoPath,
  } = useAppStore();

  const { validateCommitHash } = useGitOperations();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'branch' | 'tag' | 'commit'>('branch');
  const [commitInput, setCommitInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Get the current selected ref based on mode
  const selectedRef = mode === 'base' ? baseRef : compareRef;
  const selectedRefType = mode === 'base' ? baseRefType : compareRefType;
  const setRef = mode === 'base' ? setBaseRef : setCompareRef;

  const handleSelectBranch = (branch: string) => {
    setRef(branch, 'branch');
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleSelectTag = (tag: string) => {
    setRef(tag, 'tag');
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleValidateCommit = async () => {
    if (!repoPath || !commitInput.trim()) return;
    
    const isValid = await validateCommitHash(repoPath, commitInput.trim());
    if (isValid) {
      setRef(commitInput.trim(), 'commit');
      setIsOpen(false);
      setCommitInput('');
    } else {
      alert('Invalid commit hash');
    }
  };

  const clearSelection = () => {
    setRef(null, null);
  };

  const filteredBranches = branches.filter((branch) =>
    branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRemoteBranches = remoteBranches.filter((branch) =>
    branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTags = tags.filter((tag) =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = () => {
    if (selectedRefType === 'branch') return <GitBranch className="w-4 h-4" />;
    if (selectedRefType === 'tag') return <Tag className="w-4 h-4" />;
    if (selectedRefType === 'commit') return <Hash className="w-4 h-4" />;
    return null;
  };

  // Shorten commit hash to 7 characters for display
  const getDisplayRef = () => {
    if (selectedRefType === 'commit' && selectedRef) {
      return selectedRef.substring(0, 7);
    }
    return selectedRef;
  };

  const displayLabel = label || (mode === 'base' ? 'Base' : 'Compare');

  return (
    <div className="relative">
      {selectedRef ? (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
          {getIcon()}
          <span className="font-medium">{getDisplayRef()}</span>
          <button
            onClick={clearSelection}
            className="p-0.5 hover:bg-emerald-200 rounded transition-colors"
            title={`Clear ${displayLabel.toLowerCase()} selection`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 font-medium text-sm flex items-center gap-2"
        >
          <span>Select {displayLabel}...</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10 bg-black/10 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-20 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setActiveTab('branch')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === 'branch'
                    ? 'text-blue-600 bg-white border-b-2 border-blue-600 -mb-px'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <GitBranch className="w-4 h-4 inline mr-2" />
                Branches
              </button>
              <button
                onClick={() => setActiveTab('tag')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === 'tag'
                    ? 'text-blue-600 bg-white border-b-2 border-blue-600 -mb-px'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Tag className="w-4 h-4 inline mr-2" />
                Tags
              </button>
              <button
                onClick={() => setActiveTab('commit')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === 'commit'
                    ? 'text-blue-600 bg-white border-b-2 border-blue-600 -mb-px'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Hash className="w-4 h-4 inline mr-2" />
                Commit
              </button>
            </div>

            {/* Search for branches and tags */}
            {(activeTab === 'branch' || activeTab === 'tag') && (
              <div className="p-3 bg-slate-50 border-b border-slate-200">
                <input
                  type="text"
                  placeholder={`Search ${activeTab}s...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {activeTab === 'branch' && (
                <div className="p-2">
                  {filteredBranches.length > 0 || filteredRemoteBranches.length > 0 ? (
                    <>
                      {filteredBranches.length > 0 && (
                        <>
                          <p className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Local
                          </p>
                          {filteredBranches.map((branch) => (
                            <button
                              key={branch}
                              onClick={() => handleSelectBranch(branch)}
                              className="w-full text-left px-3 py-2.5 hover:bg-blue-50 rounded-lg flex items-center justify-between group transition-colors"
                            >
                              <span className="text-sm text-slate-700 group-hover:text-blue-700 font-medium">
                                {branch}
                              </span>
                              {branch === currentBranch && (
                                <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  <Check className="w-3 h-3" />
                                  current
                                </span>
                              )}
                            </button>
                          ))}
                        </>
                      )}
                      {filteredRemoteBranches.length > 0 && (
                        <>
                          <p className="px-2 py-1.5 mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-t border-slate-100 pt-2">
                            Remote
                          </p>
                          {filteredRemoteBranches.map((branch) => (
                            <button
                              key={branch}
                              onClick={() => handleSelectBranch(branch)}
                              className="w-full text-left px-3 py-2.5 hover:bg-blue-50 rounded-lg flex items-center justify-between group transition-colors"
                            >
                              <span className="text-sm text-slate-700 group-hover:text-blue-700 font-medium">
                                {branch}
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      No branches found. Run <code className="bg-slate-100 px-1 rounded">git fetch</code> to see remote branches.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tag' && (
                <div className="p-2">
                  {filteredTags.length > 0 ? (
                    filteredTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleSelectTag(tag)}
                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50 rounded-lg group transition-colors"
                      >
                        <span className="text-sm text-slate-700 group-hover:text-blue-700 font-medium">
                          {tag}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Tag className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p className="text-slate-500 text-sm">No tags found</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'commit' && (
                <div className="p-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Enter commit hash
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., a1b2c3d or full SHA"
                    value={commitInput}
                    onChange={(e) => setCommitInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleValidateCommit()}
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3 font-mono"
                  />
                  <button
                    onClick={handleValidateCommit}
                    disabled={!commitInput.trim()}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    Validate & Compare
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
