import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="ml-2 text-2xl font-bold text-gray-900">TPlan</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">
                기능
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                요금
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                로그인
              </Link>
              <Link href="/register" className="btn-primary">
                시작하기
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              여행 계획의 <br />
              <span className="text-primary-600">새로운 시작</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              드래그앤드롭으로 쉽게 만드는 여행 계획. <br />
              실시간 공유와 경로 계산까지, 모든 것이 한 곳에.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/planner"
                className="btn-primary text-lg px-8 py-4 rounded-xl"
              >
                🚀 무료로 시작하기
              </Link>
              <Link 
                href="/demo"
                className="btn-secondary text-lg px-8 py-4 rounded-xl"
              >
                📱 데모 보기
              </Link>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div id="features" className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                여행 계획을 더 쉽게
              </h2>
              <p className="text-xl text-gray-600">
                복잡한 여행 계획, 이제 드래그 한 번으로 해결하세요
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="card text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">드래그앤드롭</h3>
                <p className="text-gray-600">
                  직관적인 타임라인에서 플랜박스를 자유롭게 배치
                </p>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🗺️</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">스마트 경로</h3>
                <p className="text-gray-600">
                  장소 간 최적 경로와 소요시간 자동 계산
                </p>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">실시간 공유</h3>
                <p className="text-gray-600">
                  팀원과 함께 실시간으로 일정 편집 및 공유
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="ml-2 text-2xl font-bold">TPlan</span>
          </div>
          <p className="text-gray-400 mb-4">
            여행 계획의 새로운 시작
          </p>
          <p className="text-sm text-gray-500">
            © 2025 TPlan. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}