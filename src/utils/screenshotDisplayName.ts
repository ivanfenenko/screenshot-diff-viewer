/**
 * Converts a screenshot filename into a readable hierarchical display name.
 *
 * Handles patterns like:
 * - jaja.co.uk.screenshottests_HomeScreenScreenshotTest_Home_Screen_-_Over_Limit.png
 *   → HomeScreenScreenshotTest / Home_Screen / Over_Limit
 * - com.example_MyTest_Scene_One.png → MyTest / Scene_One
 * - MyTest_Scene_-_Sub.png → MyTest / Scene / Sub
 *
 * Rules:
 * 1. Remove file extension.
 * 2. "_-_" or "_ -_" is treated as hierarchy separator (like "then" or "sub-scene").
 * 3. Leading segments that look like package names (contain ".") are dropped.
 * 4. A token ending with "Test" is treated as test class and becomes its own path segment.
 * 5. Remaining tokens are joined with "_" within a segment, segments joined with " / ".
 */
export function getScreenshotDisplayName(filename: string): string {
  const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg)$/i, '').trim();
  if (!nameWithoutExt) return filename;

  // Introduce hierarchy: "_-_" or "_ -_" → "/"
  const withHierarchy = nameWithoutExt.replace(/\s*_\s*-\s*_\s*/g, '/').replace(/_\-_/g, '/');

  const segments: string[] = withHierarchy.includes('/')
    ? withHierarchy.split('/').map((s) => s.trim()).filter(Boolean)
    : [withHierarchy];

  const resultParts: string[] = [];

  for (const segment of segments) {
    const tokens = segment.split('_').filter(Boolean);
    // Drop leading package-like tokens (contain a dot)
    while (tokens.length > 0 && tokens[0].includes('.')) {
      tokens.shift();
    }
    if (tokens.length === 0) continue;

    // If first token looks like a test class (ends with "Test"), emit it as its own segment
    if (tokens[0].endsWith('Test')) {
      resultParts.push(tokens[0]);
      if (tokens.length > 1) {
        resultParts.push(tokens.slice(1).join('_'));
      }
    } else {
      resultParts.push(tokens.join('_'));
    }
  }

  return resultParts.length > 0 ? resultParts.join(' / ') : nameWithoutExt;
}

/** First character for avatar/badge (last segment or first segment). */
export function getScreenshotDisplayInitial(displayName: string): string {
  const lastSegment = displayName.split(' / ').pop() ?? displayName;
  const firstChar = lastSegment.replace(/_/g, ' ').trim().slice(0, 1);
  return firstChar.toUpperCase() || '?';
}
