/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3002', 'tplan.kr']
    }
  },
  images: {
    domains: ['localhost', 'tplan.kr'],
    formats: ['image/webp', 'image/avif'],
  },
  // CSP 헤더 추가 - 카카오 맵 API 허용
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://dapi.kakao.com https://t1.daumcdn.net http://dapi.kakao.com http://t1.daumcdn.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: http: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://dapi.kakao.com https://apis.map.kakao.com http://dapi.kakao.com",
              "frame-src 'self'",
            ].join('; ')
          }
        ]
      }
    ]
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