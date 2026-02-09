import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { useGitOperations } from '../hooks/useGitOperations';
import { ImageViewer } from './ImageViewer';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Camera, FileQuestion, Loader2 } from 'lucide-react';
import { imageCache } from '../utils/imageCache';

export const ComparisonView = () => {
  const {
    repoPath,
    selectedScreenshot,
    compareRef,
    currentBranch,
  } = useAppStore();

  const { getFileAtRef } = useGitOperations();

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [compareImage, setCompareImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  console.log('[ComparisonView RENDER] State:', {
    isLoading,
    hasCurrentImage: !!currentImage,
    hasCompareImage: !!compareImage,
    compareRef,
    screenshotName: selectedScreenshot?.name,
  });

  useEffect(() => {
    console.log('[Effect: currentImage] Triggered:', { 
      hasScreenshot: !!selectedScreenshot, 
      hasRepo: !!repoPath,
      screenshotName: selectedScreenshot?.name 
    });
    
    if (!selectedScreenshot || !repoPath) {
      console.log('[Effect: currentImage] Early return - missing data');
      return;
    }

    // Load current branch image
    const loadCurrentImage = async () => {
      try {
        console.log('[Effect: currentImage] Loading image from:', selectedScreenshot.absolute_path);
        // For current branch, use the file system path
        const imageSrc = convertFileSrc(selectedScreenshot.absolute_path);
        console.log('[Effect: currentImage] Setting currentImage:', imageSrc);
        setCurrentImage(imageSrc);
      } catch (error) {
        console.error('[Effect: currentImage] Error loading current image:', error);
      }
    };

    loadCurrentImage();
  }, [selectedScreenshot, repoPath]);

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
      setIsLoading(false);
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
        console.log('[Cache HIT] Setting isLoading to FALSE');
        setIsLoading(false);
        console.log('[Cache HIT] Setting compareImage (base64 length:', cachedImage.length, ')');
        setCompareImage(`data:image/png;base64,${cachedImage}`);
        console.log('[Cache HIT] Done setting state');
        return;
      }

      console.log('[Cache MISS] Fetching image for:', compareRef, selectedScreenshot.relative_path);
      console.log('[Cache MISS] Setting isLoading to TRUE');
      setIsLoading(true);
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
        console.log('[Cache MISS] Setting isLoading to FALSE (finally block)');
        setIsLoading(false);
      }
    };

    loadCompareImage();
  }, [selectedScreenshot, repoPath, compareRef]);

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

  if (!compareRef) {
    console.log('[ComparisonView RENDER] Single image view (no compareRef)');
    return (
      <div className="flex-1 bg-white">
        {currentImage && (
          <ImageViewer
            key={selectedScreenshot.absolute_path}
            src={currentImage}
            alt={selectedScreenshot.name}
            label={`Current Branch: ${currentBranch}`}
          />
        )}
      </div>
    );
  }

  console.log('[ComparisonView RENDER] Comparison view - rendering layout');
  return (
    <div className="flex-1 flex">
      {/* Current Branch Image */}
      <div className="flex-1 border-r-2 border-slate-200">
        {currentImage ? (
          <>
            {console.log('[ComparisonView RENDER] Rendering currentImage ImageViewer')}
            <ImageViewer
              key={selectedScreenshot.absolute_path}
              src={currentImage}
              alt={selectedScreenshot.name}
              label={`Current Branch: ${currentBranch}`}
            />
          </>
        ) : (
          console.log('[ComparisonView RENDER] No currentImage to display')
        )}
      </div>

      {/* Comparison Image */}
      <div className="flex-1">
        {(() => {
          if (isLoading) {
            console.log('[ComparisonView RENDER] Showing loading spinner');
            return (
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
            );
          } else if (compareImage) {
            console.log('[ComparisonView RENDER] Rendering compareImage ImageViewer');
            return (
              <ImageViewer
                key={`${compareRef}-${selectedScreenshot.relative_path}`}
                src={compareImage}
                alt={`${selectedScreenshot.name} (compare)`}
                label={`Compare: ${compareRef}`}
              />
            );
          } else {
            console.log('[ComparisonView RENDER] Showing "Image not found" message');
            return (
              <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
                  <FileQuestion className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Image not found</h3>
                <p className="text-sm text-slate-500 text-center max-w-sm px-4">
                  This screenshot doesn't exist in <span className="font-medium">{compareRef}</span>
                </p>
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
};
