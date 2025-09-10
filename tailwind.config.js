/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // 카테고리별 색상 (TPlan 전용)
        food: '#ff9800',           // 식사 - 오렌지
        transport: '#4caf50',      // 이동 - 그린
        activity: '#9c27b0',       // 활동 - 퍼플
        sightseeing: '#2196f3',    // 관광 - 블루
        shopping: '#e91e63',       // 쇼핑 - 핑크
        accommodation: '#673ab7',  // 숙박 - 딥퍼플
        
        // 시간대별 색상
        dawn: '#f3f0ff',      // 새벽 - 라벤더
        morning: '#fff3e0',   // 오전 - 페치
        afternoon: '#e8f5e9', // 오후 - 라이트그린
        evening: '#fce4ec',   // 저녁 - 라이트핑크
      },
      keyframes: {
        'drag-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'drop-bounce': {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-10px)' },
          '60%': { transform: 'translateY(-5px)' },
        }
      },
      animation: {
        'drag-pulse': 'drag-pulse 1s ease-in-out infinite',
        'drop-bounce': 'drop-bounce 0.8s ease-in-out',
      },
      fontFamily: {
        'sans': ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      height: {
        '15': '60px',
      },
    },
  },
  plugins: [],
}