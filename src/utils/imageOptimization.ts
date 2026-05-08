/**
 * Utility functions for image optimization
 */

export const generateSrcSet = (src: string, sizes: number[] = [320, 640, 1024, 1920]): string => {
  // For now, returns the same image at different sizes
  // In production, you'd want to use a CDN or image service
  return sizes.map(size => `${src} ${size}w`).join(', ');
};

export const generateSizes = (breakpoints: { breakpoint: string; size: string }[]): string => {
  return breakpoints.map(bp => `(max-width: ${bp.breakpoint}) ${bp.size}`).join(', ');
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const convertToWebP = async (imageUrl: string): Promise<string> => {
  // This is a placeholder - in production, conversion should happen server-side
  // or use a CDN that supports automatic format conversion
  return imageUrl;
};

export const lazyLoadImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
};
