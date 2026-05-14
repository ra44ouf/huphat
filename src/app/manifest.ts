import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'منصة شبهات',
    short_name: 'شبهات',
    description: 'إلى النور باليقين',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9f7f3',
    theme_color: '#0f3d2e',
    icons: [
      {
        src: '/icon-512.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
