import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'منصة شبهات',
    short_name: 'شبهات',
    description: 'إلى النور باليقين',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f3d2e',
    theme_color: '#c9a646',
    icons: [
      {
        src: '/icon.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/icon.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  };
}
