/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'synapse-storage.s3.amazonaws.com'],
  },
  // serverActions are enabled by default in Next.js 14
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;