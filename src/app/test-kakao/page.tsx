'use client'

import { useState, useEffect } from 'react'

export default function TestKakaoPage() {
  const [status, setStatus] = useState<string>('카카오 맵 API 로드 중...')
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    // 스크립트 동적 로드
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_API_KEY}&libraries=services&autoload=false`
    script.async = true
    
    script.onload = () => {
      console.log('스크립트 태그 로드됨')
      
      // 카카오 객체 확인
      if ((window as any).kakao && (window as any).kakao.maps) {
        // kakao.maps.load를 호출하여 API를 완전히 로드
        (window as any).kakao.maps.load(() => {
          console.log('카카오 맵 API load 콜백 실행')
          setStatus('✅ 카카오 맵 API 로드 성공!')
          setMapReady(true)
          
          // 지도 초기화
          setTimeout(() => {
            const container = document.getElementById('map')
            if (container) {
              try {
                const options = {
                  center: new (window as any).kakao.maps.LatLng(37.5665, 126.9780),
                  level: 3
                }
                const map = new (window as any).kakao.maps.Map(container, options)
                console.log('지도 생성 성공')
                
                // 장소 검색 테스트
                const ps = new (window as any).kakao.maps.services.Places()
                ps.keywordSearch('강남역', (data: any, status: any) => {
                  if (status === (window as any).kakao.maps.services.Status.OK) {
                    console.log('장소 검색 성공:', data.length, '개 결과')
                    setStatus(prev => prev + `\n✅ 장소 검색 API 작동! (${data.length}개 결과)`)
                  } else {
                    console.log('장소 검색 실패:', status)
                    setStatus(prev => prev + '\n❌ 장소 검색 실패')
                  }
                })
              } catch (error) {
                console.error('지도 생성 중 오류:', error)
                setStatus(prev => prev + '\n❌ 지도 생성 실패: ' + error)
              }
            }
          }, 100)
        })
      } else {
        setStatus('❌ 카카오 맵 객체를 찾을 수 없습니다')
        console.error('카카오 객체 없음')
      }
    }
    
    script.onerror = () => {
      setStatus('❌ 스크립트 로드 실패!')
      console.error('스크립트 로드 에러')
      
      // API 키 등록 안내
      setStatus(prev => prev + '\n\n📌 카카오 개발자 사이트에서 다음 도메인을 등록해주세요:')
      setStatus(prev => prev + '\n- http://localhost:3001')
      setStatus(prev => prev + '\n- http://localhost:3002')
      setStatus(prev => prev + '\n- http://127.0.0.1:3001')
    }
    
    document.head.appendChild(script)
    
    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거
      const scripts = document.querySelectorAll('script[src*="dapi.kakao.com"]')
      scripts.forEach(s => s.remove())
    }
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>카카오 맵 API 테스트</h1>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: status.includes('✅') ? '#d4edda' : '#f8d7da',
        color: status.includes('✅') ? '#155724' : '#721c24',
        borderRadius: '5px',
        marginBottom: '20px',
        whiteSpace: 'pre-line'
      }}>
        {status}
      </div>
      
      <div id="map" style={{ 
        width: '100%', 
        height: '400px',
        backgroundColor: '#e0e0e0',
        border: '1px solid #ccc'
      }}></div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>디버깅 정보:</h3>
        <ul>
          <li>API 키: d0d67d94afae47e0ab9c29b0e6aea5cf</li>
          <li>테스트 URL: http://localhost:3001/test-kakao</li>
          <li>프로토콜: http://</li>
        </ul>
      </div>
      
      {mapReady && (
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => {
              const ps = new (window as any).kakao.maps.services.Places()
              const query = prompt('검색할 장소를 입력하세요:')
              if (query) {
                ps.keywordSearch(query, (data: any, status: any) => {
                  if (status === (window as any).kakao.maps.services.Status.OK) {
                    alert(`"${query}" 검색 결과: ${data.length}개\n\n첫 번째 결과:\n${data[0].place_name}\n${data[0].address_name}`)
                  } else {
                    alert('검색 실패')
                  }
                })
              }
            }}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            장소 검색 테스트
          </button>
        </div>
      )}
      
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h3>⚠️ API가 작동하지 않는 경우:</h3>
        <ol>
          <li><a href="https://developers.kakao.com/" target="_blank" rel="noopener noreferrer">카카오 개발자 사이트</a> 접속</li>
          <li>내 애플리케이션 → 앱 선택</li>
          <li>앱 설정 → 플랫폼 → Web 플랫폼 등록</li>
          <li>사이트 도메인에 다음 추가:
            <ul>
              <li>http://localhost:3001</li>
              <li>http://localhost:3002</li>
              <li>http://127.0.0.1:3001</li>
              <li>http://127.0.0.1:3002</li>
            </ul>
          </li>
          <li>저장 후 페이지 새로고침</li>
        </ol>
      </div>
    </div>
  )
}