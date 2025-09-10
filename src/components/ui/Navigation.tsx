import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="ml-2 text-2xl font-bold text-gray-900">TPlan</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/planner" className="text-gray-600 hover:text-gray-900 transition-colors">
              플래너
            </Link>
            <Link href="/trips" className="text-gray-600 hover:text-gray-900 transition-colors">
              내 여행
            </Link>
            <Link href="/templates" className="text-gray-600 hover:text-gray-900 transition-colors">
              템플릿
            </Link>
            
            <div className="flex items-center space-x-2">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                로그인
              </button>
              <Link
                href="/register" 
                className="btn-primary"
              >
                시작하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}