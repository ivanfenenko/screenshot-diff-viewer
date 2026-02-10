import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, ZoomIn } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt: string;
  label?: string;
}

export const ImageViewer = ({ src, alt, label }: ImageViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const previousSrcRef = useRef<string>(src);
  const imgRef = useRef<HTMLImageElement>(null);

  console.log('[ImageViewer RENDER]', { label, isLoading, hasError: !!error, hasDimensions: !!dimensions, src: src?.substring(0, 80), prevSrc: previousSrcRef.current?.substring(0, 80) });

  // Check if src changed and reset state BEFORE rendering
  if (src !== previousSrcRef.current) {
    console.log('[ImageViewer] Src changed! Resetting state');
    console.log('[ImageViewer] Old src:', previousSrcRef.current);
    console.log('[ImageViewer] New src:', src);
    previousSrcRef.current = src;
    if (!isLoading) {
      console.log('[ImageViewer] Setting isLoading to true because src changed');
    }
    // Don't set state here - it will cause issues
    // Instead, we'll handle this differently
  }

  useEffect(() => {
    console.log('[ImageViewer Effect] Running effect for src change');
    setIsLoading(true);
    setError(null);
    setDimensions(null);
    
    // Check if image is already loaded (cached)
    if (imgRef.current?.complete && imgRef.current?.naturalHeight !== 0) {
      console.log('[ImageViewer Effect] Image already loaded from cache');
      setIsLoading(false);
      setDimensions({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight
      });
    }
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('[ImageViewer handleLoad] Image loaded successfully for:', label);
    setIsLoading(false);
    const img = e.currentTarget;
    setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    console.log('[ImageViewer handleLoad] Image dimensions:', img.naturalWidth, 'x', img.naturalHeight);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('[ImageViewer handleError] Image failed to load:', label);
    console.error('[ImageViewer handleError] Error event:', e);
    setIsLoading(false);
    setError('Failed to load image');
  };

  return (
    <div className="flex flex-col h-full bg-white min-h-0">
      {/* Header with label and dimensions */}
      {label && (
        <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-slate-700">{label}</span>
            {dimensions && !isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ZoomIn className="w-3 h-3" />
                <span>{dimensions.width} × {dimensions.height}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image container */}
      <div className="flex-1 min-h-0 relative bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        {/* Loading state overlay */}
        {isLoading && (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full opacity-20 absolute inset-0 animate-ping"></div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" strokeWidth={2.5} />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600 font-medium">Loading image...</p>
            </div>
          </>
        )}

        {/* Error state overlay */}
        {error && (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-sm text-slate-500 mt-1">Please check the file path</p>
            </div>
          </>
        )}

        {/* Image - always rendered but hidden behind loading/error overlay */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className="rounded-lg shadow-lg"
          style={{ 
            visibility: isLoading || error ? 'hidden' : 'visible',
            maxWidth: 'calc(100% - 2rem)',
            maxHeight: 'calc(100% - 2rem)',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
};
