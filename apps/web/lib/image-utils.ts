/**
 * Utility to help with image loading and preloading
 */

interface ImagePreloadOptions {
  priority?: boolean;
  sizes?: string;
}

/**
 * Preload an image for faster rendering
 */
export function preloadImage(src: string): void {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Preload multiple images
 */
export function preloadImages(sources: string[]): void {
  sources.forEach(preloadImage);
}

/**
 * Get optimized image size for viewport
 */
export function getImageSize(
  viewport: "mobile" | "tablet" | "desktop"
): { width: number; height: number } {
  switch (viewport) {
    case "mobile":
      return { width: 320, height: 320 };
    case "tablet":
      return { width: 512, height: 512 };
    case "desktop":
      return { width: 768, height: 768 };
  }
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(baseSrc: string): string {
  const sizes = [1, 2];
  return sizes
    .map((size) => {
      const url = new URL(baseSrc);
      if (url.hostname === "raw.githubusercontent.com") {
        return `${baseSrc} ${size}x`;
      }
      return `${baseSrc}?size=${size * 96} ${size}x`;
    })
    .join(", ");
}
