import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TPlan - 여행 계획의 새로운 시작',
  description: '드래그앤드롭으로 쉽게 만드는 여행 계획. 실시간 공유와 경로 계산까지.',
  keywords: ['여행계획', '일정관리', '드래그앤드롭', '타임라인', '여행'],
  authors: [{ name: 'TPlan Team', url: 'https://tplan.kr' }],
  creator: 'TPlan',
  publisher: 'TPlan',
  openGraph: {
    title: 'TPlan - 여행 계획의 새로운 시작',
    description: '드래그앤드롭으로 쉽게 만드는 여행 계획',
    url: 'https://tplan.kr',
    siteName: 'TPlan',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TPlan - 여행 계획의 새로운 시작',
    description: '드래그앤드롭으로 쉽게 만드는 여행 계획',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#2196f3',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link 
          href="https://fonts.googleapis.com/icon?family=Material+Icons" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}