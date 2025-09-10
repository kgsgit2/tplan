/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'tplan.kr']
    }
  },
  images: {
    domains: ['localhost', 'tplan.kr'],
    formats: ['image/webp', 'image/avif'],
  },
  // PWA 설정을 위한 준비
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  }
}

module.exports = nextConfig