import { useState, useMemo, useEffect } from 'react';
import { Search, Image as ImageIcon, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import type { Screenshot } from '../types';
import { getScreenshotDisplayName, getScreenshotDisplayInitial } from '../utils/screenshotDisplayName';

export const ScreenshotList = () => {
  const { screenshots, selectedScreenshot, setSelectedScreenshot, compareRef } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'deleted'>('all');
  // Track which folders are collapsed (simpler than "expanded" — no empty-means-all ambiguity)
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(() => new Set());

  // Reset filter to 'all' when compareRef changes or is cleared
  useEffect(() => {
    setStatusFilter('all');
  }, [compareRef]);

  const filteredScreenshots = screenshots.filter((screenshot) => {
    // Apply search filter
    const matchesSearch = screenshot.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Apply status filter only if compareRef is set
    if (compareRef && statusFilter !== 'all') {
      if (statusFilter === 'new' && screenshot.status !== 'new') return false;
      if (statusFilter === 'deleted' && screenshot.status !== 'deleted') return false;
    }

    return true;
  });

  const groups = useMemo(() => {
    const map = new Map<string, Screenshot[]>();
    for (const s of filteredScreenshots) {
      const folder = s.relative_path.split('/').slice(0, -1).join('/');
      if (!map.has(folder)) map.set(folder, []);
      map.get(folder)!.push(s);
    }
    return Array.from(map.entries())
      .map(([folder, list]) => ({ folder, screenshots: list }))
      .sort((a, b) => a.folder.localeCompare(b.folder));
  }, [filteredScreenshots]);

  const getFolderLabel = (folder: string): string => {
    const parts = folder.split('/');
    const imagesIdx = parts.indexOf('images');
    if (imagesIdx > 0) return parts[imagesIdx - 1];
    return parts[parts.length - 1] || folder;
  };

  const toggleFolder = (folder: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const expandAll = () => setCollapsedFolders(new Set());
  const collapseAll = () => setCollapsedFolders(new Set(groups.map((g) => g.folder)));

  const isFolderExpanded = (folder: string) => !collapsedFolders.has(folder);

  return (
    <div className="w-full border-r border-slate-200 bg-white flex flex-col h-full shadow-sm min-w-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-blue-600" />
          Screenshots
        </h2>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search screenshots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
          />
        </div>

        {/* Status Filters - Only show when comparing branches */}
        {compareRef && (
          <div className="mt-3 flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="statusFilter"
                value="all"
                checked={statusFilter === 'all'}
                onChange={(e) => setStatusFilter(e.target.value as 'all')}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">
                All
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="statusFilter"
                value="new"
                checked={statusFilter === 'new'}
                onChange={(e) => setStatusFilter(e.target.value as 'new')}
                className="w-4 h-4 text-green-600 border-slate-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">
                <span className="text-green-700">New</span>
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="statusFilter"
                value="deleted"
                checked={statusFilter === 'deleted'}
                onChange={(e) => setStatusFilter(e.target.value as 'deleted')}
                className="w-4 h-4 text-red-600 border-slate-300 focus:ring-2 focus:ring-red-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">
                <span className="text-red-700">Deleted</span>
              </span>
            </label>
          </div>
        )}
        
        {/* Count */}
        <div className="mt-3 flex items-center justify-between text-xs flex-wrap gap-y-1">
          <span className="text-slate-500">
            {filteredScreenshots.length} of {screenshots.length} shown
          </span>
          <div className="flex gap-1 items-center">
            {groups.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={expandAll}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Expand
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Collapse
                </button>
                <span className="text-slate-300">|</span>
              </>
            )}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Screenshot List by folder */}
      <div className="flex-1 overflow-y-auto">
        {groups.length > 0 ? (
          groups.map(({ folder, screenshots: groupShots }) => {
            const isExpanded = isFolderExpanded(folder);
            const label = getFolderLabel(folder);
            return (
              <div key={folder} className="border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => toggleFolder(folder)}
                  className="w-full px-4 py-2.5 flex items-center gap-2 text-left bg-slate-50 hover:bg-slate-100 border-b border-slate-100 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  )}
                  <Folder className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="font-medium text-sm text-slate-700 truncate">{label}</span>
                  <span className="ml-auto text-xs text-slate-500 flex-shrink-0">
                    {groupShots.length}
                  </span>
                </button>
                {isExpanded &&
                  groupShots.map((screenshot) => (
                    <button
                      key={screenshot.relative_path}
                      onClick={() => setSelectedScreenshot(screenshot)}
                      className={`w-full px-4 py-3 pl-10 text-left border-b border-slate-50 transition-all group ${
                        selectedScreenshot?.relative_path === screenshot.relative_path
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-600'
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium ${
                            selectedScreenshot?.relative_path === screenshot.relative_path
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                          }`}
                        >
                          {getScreenshotDisplayInitial(getScreenshotDisplayName(screenshot.name))}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col items-end overflow-hidden">
                          <div className="flex items-center gap-2 w-full justify-end">
                            {screenshot.status === 'new' && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 rounded">
                                New
                              </span>
                            )}
                            {screenshot.status === 'deleted' && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 rounded">
                                Deleted
                              </span>
                            )}
                            <div
                              className={`font-medium text-sm text-right overflow-hidden text-ellipsis whitespace-nowrap [direction:rtl] ${
                                selectedScreenshot?.relative_path === screenshot.relative_path
                                  ? 'text-blue-900'
                                  : 'text-slate-900'
                              }`}
                              title={getScreenshotDisplayName(screenshot.name)}
                            >
                              {getScreenshotDisplayName(screenshot.name)}
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 w-full text-right overflow-hidden text-ellipsis whitespace-nowrap [direction:rtl]" title={screenshot.name}>
                            {screenshot.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">
              {searchTerm ? 'No matches found' : 'No screenshots'}
            </p>
            <p className="text-xs text-slate-500">
              {searchTerm ? 'Try a different search term' : 'Add screenshots to your repository'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
