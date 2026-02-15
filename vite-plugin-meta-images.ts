import type { Plugin } from 'vite';

/**
 * Vite plugin that updates og:image and twitter:image meta tags
 * to point to the app's opengraph image with the correct domain.
 */
export function metaImagesPlugin(): Plugin {
  return {
    name: 'meta-images',
    transformIndexHtml(html) {
      const baseUrl = getDeploymentUrl();
      if (!baseUrl) {
        log('[meta-images] no deployment domain found, skipping meta tag updates');
        return html;
      }

      const imageUrl = `${baseUrl}/opengraph-image.png`;
      log('[meta-images] updating meta tags to:', imageUrl);

      return html
        .replace(
          /<meta property="og:image" content="[^"]*" \/>/,
          `<meta property="og:image" content="${imageUrl}" />`
        )
        .replace(
          /<meta name="twitter:image" content="[^"]*" \/>/,
          `<meta name="twitter:image" content="${imageUrl}" />`
        );
    },
  };
}

function getDeploymentUrl(): string | null {
  // Check for custom deployment domain environment variable
  if (process.env.DEPLOYMENT_DOMAIN) {
    const url = `https://${process.env.DEPLOYMENT_DOMAIN}`;
    log('[meta-images] using deployment domain:', url);
    return url;
  }

  // Fallback to localhost for development
  if (process.env.NODE_ENV === 'development') {
    const url = 'http://localhost:5000';
    log('[meta-images] using development domain:', url);
    return url;
  }

  return null;
}

function log(...args: any[]): void {
  if (process.env.NODE_ENV === 'production') {
    console.log(...args);
  }
}
