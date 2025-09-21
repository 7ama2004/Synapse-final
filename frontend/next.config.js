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
  webpack: (config, { isServer }) => {
    // Handle Konva.js canvas module resolution
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // Exclude canvas from client-side bundle
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        canvas: 'canvas',
      });
    }
    
    return config;
  },
};

module.exports = nextConfig;