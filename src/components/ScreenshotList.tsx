import { useState } from 'react';
import { Search, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

export const ScreenshotList = () => {
  const { screenshots, selectedScreenshot, setSelectedScreenshot } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredScreenshots = screenshots.filter((screenshot) =>
    screenshot.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Extract display name from screenshot filename
  // Example: "com.example.demoarchitecture.ui_ScreenshotsDarkTest_homeScreenDark.png" -> "homeScreenDark"
  const getDisplayName = (filename: string): string => {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg)$/i, '');
    
    // Find the last underscore and take everything after it
    const lastUnderscoreIndex = nameWithoutExt.lastIndexOf('_');
    
    if (lastUnderscoreIndex !== -1 && lastUnderscoreIndex < nameWithoutExt.length - 1) {
      return nameWithoutExt.substring(lastUnderscoreIndex + 1);
    }
    
    // If no underscore found, return the whole name without extension
    return nameWithoutExt;
  };

  return (
    <div className="w-80 border-r border-slate-200 bg-white flex flex-col h-full shadow-sm">
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
        
        {/* Count */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {filteredScreenshots.length} of {screenshots.length} shown
          </span>
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

      {/* Screenshot List */}
      <div className="flex-1 overflow-y-auto">
        {filteredScreenshots.map((screenshot, index) => (
          <button
            key={screenshot.relative_path}
            onClick={() => setSelectedScreenshot(screenshot)}
            className={`w-full p-4 text-left border-b border-slate-100 transition-all group ${
              selectedScreenshot?.relative_path === screenshot.relative_path
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-600'
                : 'hover:bg-slate-50 border-l-4 border-l-transparent'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Index Badge */}
              <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium ${
                selectedScreenshot?.relative_path === screenshot.relative_path
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
              }`}>
                {index + 1}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm truncate ${
                  selectedScreenshot?.relative_path === screenshot.relative_path
                    ? 'text-blue-900'
                    : 'text-slate-900'
                }`}>
                  {getDisplayName(screenshot.name)}
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate" title={screenshot.name}>
                  {screenshot.relative_path.split('/').slice(0, -1).join('/')}
                </div>
              </div>
            </div>
          </button>
        ))}

        {filteredScreenshots.length === 0 && (
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
