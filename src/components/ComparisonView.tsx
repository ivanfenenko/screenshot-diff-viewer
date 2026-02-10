import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { useGitOperations } from '../hooks/useGitOperations';
import { ImageViewer } from './ImageViewer';
import { Camera, FileQuestion, Loader2, ChevronLeft, ChevronRight, Columns2, Columns3 } from 'lucide-react';
import { imageCache } from '../utils/imageCache';
import { createDiffImageDataUrl } from '../utils/imageDiff';

export const ComparisonView = () => {
  const {
    repoPath,
    screenshots,
    selectedScreenshot,
    baseRef,
    compareRef,
    setSelectedScreenshot,
  } = useAppStore();

  const { getFileAtRef } = useGitOperations();

  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [compareImage, setCompareImage] = useState<string | null>(null);
  const [diffImage, setDiffImage] = useState<string | null>(null);
  const [isLoadingBase, setIsLoadingBase] = useState(false);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [showDiffPane, setShowDiffPane] = useState(true);

  console.log('[ComparisonView RENDER] State:', {
    isLoadingBase,
    isLoadingCompare,
    hasBaseImage: !!baseImage,
    hasCompareImage: !!compareImage,
    baseRef,
    compareRef,
    screenshotName: selectedScreenshot?.name,
  });

  // Navigation functions
  const currentIndex = screenshots.findIndex(
    (s) => s.relative_path === selectedScreenshot?.relative_path
  );

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < screenshots.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      setSelectedScreenshot(screenshots[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setSelectedScreenshot(screenshots[currentIndex + 1]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious) {
        goToPrevious();
      } else if (e.key === 'ArrowRight' && hasNext) {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, screenshots]);

  useEffect(() => {
    console.log('[Effect: baseImage] Triggered:', { 
      hasScreenshot: !!selectedScreenshot, 
      hasRepo: !!repoPath,
      baseRef,
      screenshotName: selectedScreenshot?.name 
    });
    
    if (!selectedScreenshot || !repoPath || !baseRef) {
      console.log('[Effect: baseImage] Early return - missing data');
      setBaseImage(null);
      setIsLoadingBase(false);
      return;
    }

    // Load base image from Git ref
    const loadBaseImage = async () => {
      // Check cache first
      const cachedImage = imageCache.get(
        repoPath,
        baseRef,
        selectedScreenshot.relative_path
      );

      if (cachedImage) {
        console.log('[Cache HIT] Using cached base image for:', baseRef, selectedScreenshot.relative_path);
        setIsLoadingBase(false);
        setBaseImage(`data:image/png;base64,${cachedImage}`);
        return;
      }

      console.log('[Cache MISS] Fetching base image for:', baseRef, selectedScreenshot.relative_path);
      setIsLoadingBase(true);
      try {
        console.log('[Cache MISS] Calling getFileAtRef...');
        const base64Content = await getFileAtRef(
          repoPath,
          baseRef,
          selectedScreenshot.relative_path
        );
        console.log('[Cache MISS] Got response (base64 length:', base64Content.length, ')');
        
        // Store in cache
        imageCache.set(repoPath, baseRef, selectedScreenshot.relative_path, base64Content);
        console.log('[Cache STORE] Cached base image for:', baseRef, selectedScreenshot.relative_path);
        
        console.log('[Cache MISS] Setting baseImage');
        setBaseImage(`data:image/png;base64,${base64Content}`);
      } catch (error) {
        console.error('[Cache MISS] Error loading base image:', error);
        setBaseImage(null);
      } finally {
        console.log('[Cache MISS] Setting isLoadingBase to FALSE (finally block)');
        setIsLoadingBase(false);
      }
    };

    loadBaseImage();
  }, [selectedScreenshot, repoPath, baseRef]);

  useEffect(() => {
    console.log('[Effect: compareImage] Triggered:', { 
      hasScreenshot: !!selectedScreenshot, 
      hasRepo: !!repoPath,
      compareRef,
      screenshotName: selectedScreenshot?.name 
    });

    if (!selectedScreenshot || !repoPath || !compareRef) {
      console.log('[Effect: compareImage] Early return - clearing state');
      setCompareImage(null);
      setIsLoadingCompare(false);
      return;
    }

    // Load compare image
    const loadCompareImage = async () => {
      console.log('[Effect: compareImage] Starting load function');
      
      // Check cache first
      const cachedImage = imageCache.get(
        repoPath,
        compareRef,
        selectedScreenshot.relative_path
      );

      if (cachedImage) {
        console.log('[Cache HIT] Using cached image for:', compareRef, selectedScreenshot.relative_path);
        console.log('[Cache HIT] Setting isLoadingCompare to FALSE');
        setIsLoadingCompare(false);
        console.log('[Cache HIT] Setting compareImage (base64 length:', cachedImage.length, ')');
        setCompareImage(`data:image/png;base64,${cachedImage}`);
        console.log('[Cache HIT] Done setting state');
        return;
      }

      console.log('[Cache MISS] Fetching image for:', compareRef, selectedScreenshot.relative_path);
      console.log('[Cache MISS] Setting isLoadingCompare to TRUE');
      setIsLoadingCompare(true);
      try {
        console.log('[Cache MISS] Calling getFileAtRef...');
        const base64Content = await getFileAtRef(
          repoPath,
          compareRef,
          selectedScreenshot.relative_path
        );
        console.log('[Cache MISS] Got response (base64 length:', base64Content.length, ')');
        
        // Store in cache
        imageCache.set(repoPath, compareRef, selectedScreenshot.relative_path, base64Content);
        console.log('[Cache STORE] Cached image for:', compareRef, selectedScreenshot.relative_path);
        
        console.log('[Cache MISS] Setting compareImage');
        setCompareImage(`data:image/png;base64,${base64Content}`);
      } catch (error) {
        console.error('[Cache MISS] Error loading compare image:', error);
        setCompareImage(null);
      } finally {
        console.log('[Cache MISS] Setting isLoadingCompare to FALSE (finally block)');
        setIsLoadingCompare(false);
      }
    };

    loadCompareImage();
  }, [selectedScreenshot, repoPath, compareRef]);

  // Compute diff image when both base and compare are loaded
  useEffect(() => {
    if (!baseImage || !compareImage) {
      setDiffImage(null);
      setIsLoadingDiff(false);
      return;
    }
    let cancelled = false;
    setIsLoadingDiff(true);
    setDiffImage(null);
    createDiffImageDataUrl(baseImage, compareImage).then((url) => {
      if (!cancelled) {
        setDiffImage(url);
        setIsLoadingDiff(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [baseImage, compareImage]);

  if (!selectedScreenshot) {
    console.log('[ComparisonView RENDER] Showing "Select a screenshot" message');
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md px-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <Camera className="w-12 h-12 text-blue-600" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Select a screenshot</h3>
          <p className="text-slate-500">
            Choose a screenshot from the list to view or compare
          </p>
        </div>
      </div>
    );
  }

  if (!baseRef && !compareRef) {
    console.log('[ComparisonView RENDER] No refs selected - showing empty state');
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md px-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <Camera className="w-12 h-12 text-blue-600" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Select branches to compare</h3>
          <p className="text-slate-500">
            Choose base and compare branches from the selectors above
          </p>
        </div>
      </div>
    );
  }

  console.log('[ComparisonView RENDER] Comparison view - rendering layout');
  return (
    <div className="flex-1 flex flex-col">
      {/* Navigation Bar */}
      {selectedScreenshot && screenshots.length > 1 && (
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <button
            onClick={goToPrevious}
            disabled={!hasPrevious}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 disabled:hover:bg-transparent text-slate-700"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">Screenshot</span>
            <span className="px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold rounded-lg">
              {currentIndex + 1} / {screenshots.length}
            </span>
            {compareRef && (
              <button
                type="button"
                onClick={() => setShowDiffPane((v) => !v)}
                title={showDiffPane ? 'Hide diff view' : 'Show diff view'}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  showDiffPane
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {showDiffPane ? (
                  <Columns3 className="w-4 h-4" />
                ) : (
                  <Columns2 className="w-4 h-4" />
                )}
                <span>Diff</span>
              </button>
            )}
          </div>

          <button
            onClick={goToNext}
            disabled={!hasNext}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 disabled:hover:bg-transparent text-slate-700"
          >
            <span>Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Diff toggle bar (when comparing but nav bar might be hidden, e.g. single screenshot) */}
      {compareRef && (!selectedScreenshot || screenshots.length <= 1) && (
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-end">
          <button
            type="button"
            onClick={() => setShowDiffPane((v) => !v)}
            title={showDiffPane ? 'Hide diff view' : 'Show diff view'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              showDiffPane ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {showDiffPane ? <Columns3 className="w-4 h-4" /> : <Columns2 className="w-4 h-4" />}
            <span>Diff</span>
          </button>
        </div>
      )}

      {/* Main comparison area */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Base Image */}
        <div className="flex-1 min-h-0 border-r-2 border-slate-200">
          {isLoadingBase ? (
            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full opacity-20 absolute inset-0 animate-ping"></div>
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-white" strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-slate-700 font-semibold mb-1">Loading base image</p>
              <p className="text-sm text-slate-500">Fetching {baseRef}...</p>
            </div>
          ) : baseImage ? (
            <ImageViewer
              key={`${baseRef}-${selectedScreenshot?.relative_path}`}
              src={baseImage}
              alt={selectedScreenshot?.name || 'Base'}
              label={`Base: ${baseRef}`}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
                <FileQuestion className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Image not found</h3>
              <p className="text-sm text-slate-500 text-center max-w-sm px-4">
                This screenshot doesn't exist in <span className="font-medium">{baseRef}</span>
              </p>
            </div>
          )}
        </div>

        {/* Diff pane (only when compare ref is selected and toggle is on) */}
        {compareRef && showDiffPane && (
          <div className="flex-1 min-h-0 border-r-2 border-slate-200">
            {isLoadingDiff ? (
              <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full opacity-20 absolute inset-0 animate-ping"></div>
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <p className="text-slate-700 font-semibold mb-1">Computing diff</p>
                <p className="text-sm text-slate-500">Highlighting pixel differences...</p>
              </div>
            ) : diffImage ? (
              <ImageViewer
                key={`diff-${selectedScreenshot?.relative_path}`}
                src={diffImage}
                alt={`Diff: ${selectedScreenshot?.name}`}
                label="Diff"
              />
            ) : baseImage && compareImage ? (
              <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <FileQuestion className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Cannot compute diff</h3>
                <p className="text-sm text-slate-500 text-center max-w-sm px-4">
                  Different dimensions between base and compare images
                </p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <p className="text-sm text-slate-500 text-center max-w-sm px-4">
                  Load both images to see diff
                </p>
              </div>
            )}
          </div>
        )}

        {/* Compare Image */}
        <div className="flex-1 min-h-0">
          {isLoadingCompare ? (
            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full opacity-20 absolute inset-0 animate-ping"></div>
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-white" strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-slate-700 font-semibold mb-1">Loading comparison</p>
              <p className="text-sm text-slate-500">Fetching {compareRef}...</p>
            </div>
          ) : compareImage ? (
            <ImageViewer
              key={`${compareRef}-${selectedScreenshot?.relative_path}`}
              src={compareImage}
              alt={`${selectedScreenshot?.name} (compare)` || 'Compare'}
              label={`Compare: ${compareRef}`}
            />
          ) : compareRef ? (
            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
                <FileQuestion className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Image not found</h3>
              <p className="text-sm text-slate-500 text-center max-w-sm px-4">
                This screenshot doesn't exist in <span className="font-medium">{compareRef}</span>
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                <Camera className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Select compare branch</h3>
              <p className="text-sm text-slate-500">Choose a branch to compare with</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
