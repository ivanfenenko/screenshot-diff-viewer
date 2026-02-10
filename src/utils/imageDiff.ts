/**
 * Creates a diff image from two screenshot data URLs.
 * Pixels that differ between base and compare are highlighted (e.g. red);
 * unchanged pixels show the base image dimmed.
 * Returns null if dimensions differ or images fail to load.
 */
export function createDiffImageDataUrl(
  baseDataUrl: string,
  compareDataUrl: string
): Promise<string | null> {
  return new Promise((resolve) => {
    const baseImg = new Image();
    const compareImg = new Image();
    let baseLoaded = false;
    let compareLoaded = false;

    function tryCreateDiff() {
      if (!baseLoaded || !compareLoaded) return;

      const w = baseImg.naturalWidth;
      const h = baseImg.naturalHeight;
      if (compareImg.naturalWidth !== w || compareImg.naturalHeight !== h) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(baseImg, 0, 0);
      const baseData = ctx.getImageData(0, 0, w, h);

      ctx.drawImage(compareImg, 0, 0);
      const compareData = ctx.getImageData(0, 0, w, h);

      const out = ctx.createImageData(w, h);
      const basePixels = baseData.data;
      const comparePixels = compareData.data;
      const outPixels = out.data;

      // Difference threshold (ignore tiny sub-pixel differences)
      const threshold = 25;

      for (let i = 0; i < basePixels.length; i += 4) {
        const dr = Math.abs(basePixels[i] - comparePixels[i]);
        const dg = Math.abs(basePixels[i + 1] - comparePixels[i + 1]);
        const db = Math.abs(basePixels[i + 2] - comparePixels[i + 2]);
        const diff = dr > threshold || dg > threshold || db > threshold;

        if (diff) {
          outPixels[i] = 255;     // R
          outPixels[i + 1] = 0;   // G
          outPixels[i + 2] = 0;   // B (pure red)
          outPixels[i + 3] = 220;
        } else {
          // Unchanged: show base dimmed
          outPixels[i] = Math.floor(basePixels[i] * 0.6);
          outPixels[i + 1] = Math.floor(basePixels[i + 1] * 0.6);
          outPixels[i + 2] = Math.floor(basePixels[i + 2] * 0.6);
          outPixels[i + 3] = basePixels[i + 3];
        }
      }

      ctx.putImageData(out, 0, 0);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    }

    baseImg.onload = () => {
      baseLoaded = true;
      tryCreateDiff();
    };
    baseImg.onerror = () => resolve(null);

    compareImg.onload = () => {
      compareLoaded = true;
      tryCreateDiff();
    };
    compareImg.onerror = () => resolve(null);

    baseImg.crossOrigin = 'anonymous';
    compareImg.crossOrigin = 'anonymous';
    baseImg.src = baseDataUrl;
    compareImg.src = compareDataUrl;
  });
}
