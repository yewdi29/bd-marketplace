/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    deviceSizes: [384, 414, 448, 640, 750, 828, 1080, 1200, 1920, 2048],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wjnerswualzlurhdiizn.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/listings',
        destination: '/search',
        permanent: true,
      },
      {
        source: '/knowledge-base',
        destination: '/journal',
        permanent: true,
      },
      {
        source: '/knowledge-base/:slug',
        destination: '/journal/:slug',
        permanent: true,
      },
    ]
  },
}
export default nextConfig
