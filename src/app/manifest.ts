import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FinTrack - Sistem Keuangan',
    short_name: 'FinTrack',
    description: 'Kelola keuangan Anda dengan mudah dan efisien',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F8F9FD',
    theme_color: '#10b981',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
