/**
 * Simple in-memory cache for base64 image data
 * Cache key format: `${repoPath}|${gitRef}|${filePath}`
 */

class ImageCache {
  private cache: Map<string, string> = new Map();

  /**
   * Generate cache key from repo path, git ref, and file path
   */
  private getCacheKey(repoPath: string, gitRef: string, filePath: string): string {
    return `${repoPath}|${gitRef}|${filePath}`;
  }

  /**
   * Get cached image base64 data
   */
  get(repoPath: string, gitRef: string, filePath: string): string | null {
    const key = this.getCacheKey(repoPath, gitRef, filePath);
    return this.cache.get(key) || null;
  }

  /**
   * Store image base64 data in cache
   */
  set(repoPath: string, gitRef: string, filePath: string, base64Data: string): void {
    const key = this.getCacheKey(repoPath, gitRef, filePath);
    this.cache.set(key, base64Data);
  }

  /**
   * Check if image is cached
   */
  has(repoPath: string, gitRef: string, filePath: string): boolean {
    const key = this.getCacheKey(repoPath, gitRef, filePath);
    return this.cache.has(key);
  }

  /**
   * Clear all cached images
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for a specific repository
   */
  clearRepo(repoPath: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(`${repoPath}|`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const imageCache = new ImageCache();
