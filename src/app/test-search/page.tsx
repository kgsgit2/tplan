'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import KakaoMapLoader, { isKakaoMapAvailable } from '../planner/KakaoMapLoader'

interface Place {
  place_name: string
  address_name: string
  road_address_name?: string
  phone?: string
  x: string
  y: string
  category_name?: string
}

export default function TestSearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Place[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [kakaoLoaded, setKakaoLoaded] = useState(false)
  const [kakaoError, setKakaoError] = useState<string | null>(null)
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(-1)
  const [logs, setLogs] = useState<string[]>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // 로그 추가 함수
  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, { message: logMessage, type } as any])
  }

  // 카카오 맵 로드 핸들러
  const handleKakaoMapLoad = useCallback(() => {
    setKakaoLoaded(true)
    setKakaoError(null)
    addLog('카카오 맵 로드 성공', 'success')
  }, [])

  const handleKakaoMapError = useCallback((error: string) => {
    setKakaoLoaded(false)
    setKakaoError(error)
    addLog(`카카오 맵 로드 실패: ${error}`, 'error')
  }, [])

  // kakaoLoaded가 true일 때 검색 재시도
  useEffect(() => {
    if (kakaoLoaded && searchQuery && searchQuery.length >= 2) {
      addLog(`카카오 맵 로드 완료, 검색 재시도: ${searchQuery}`, 'info')
      searchPlaces(searchQuery)
    }
  }, [kakaoLoaded])

  // Kakao Places API search
  const searchPlaces = useCallback((query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      setSelectedResultIndex(-1)
      return
    }
    
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      addLog('카카오 맵 API가 아직 로드되지 않았습니다', 'error')
      addLog(`window.kakao: ${!!window.kakao}`, 'info')
      addLog(`window.kakao.maps: ${!!(window.kakao && window.kakao.maps)}`, 'info')
      addLog(`window.kakao.maps.services: ${!!(window.kakao && window.kakao.maps && window.kakao.maps.services)}`, 'info')
      addLog(`kakaoLoaded state: ${kakaoLoaded}`, 'info')
      return
    }
    
    addLog(`장소 검색 시작: "${query}"`, 'info')
    setIsSearching(true)
    
    try {
      const ps = new window.kakao.maps.services.Places()
      addLog('Places 서비스 생성 성공', 'success')
      
      ps.keywordSearch(query, (data: any, status: any) => {
        addLog(`검색 콜백 호출, 상태: ${status}`, 'info')
        setIsSearching(false)
        
        if (status === window.kakao.maps.services.Status.OK) {
          addLog(`검색 성공! 결과 수: ${data.length}`, 'success')
          if (data.length > 0) {
            addLog(`첫 번째 결과: ${data[0].place_name}`, 'info')
          }
          setSearchResults(data.slice(0, 5))
          setSelectedResultIndex(-1)
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          addLog('검색 결과가 없습니다', 'info')
          setSearchResults([])
          setSelectedResultIndex(-1)
        } else {
          addLog(`검색 오류: ${status}`, 'error')
          setSearchResults([])
          setSelectedResultIndex(-1)
        }
      })
    } catch (error: any) {
      addLog(`장소 검색 중 오류: ${error.message}`, 'error')
      setIsSearching(false)
      setSearchResults([])
      setSelectedResultIndex(-1)
    }
  }, [kakaoLoaded])

  // Handle search input with debouncing
  const handleSearchInput = (query: string) => {
    addLog(`검색어 입력: "${query}"`, 'info')
    setSearchQuery(query)
    
    if (!query || query.length < 2) {
      setSearchResults([])
      setSelectedResultIndex(-1)
      return
    }
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      addLog(`디바운스 후 검색 실행: "${query}"`, 'info')
      searchPlaces(query)
    }, 300)
  }

  // Select a place from search results
  const selectPlace = (place: Place) => {
    addLog(`선택된 장소: ${place.place_name}`, 'success')
    setSearchQuery(place.place_name)
    setSearchResults([])
  }

  return (
    <>
      <KakaoMapLoader onLoad={handleKakaoMapLoad} onError={handleKakaoMapError} />
      <div style={{
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '24px',
          color: '#1a1a1a'
        }}>
          카카오 장소 검색 테스트
        </h1>

        {/* 상태 표시 */}
        <div style={{
          padding: '16px',
          marginBottom: '24px',
          borderRadius: '8px',
          backgroundColor: kakaoLoaded ? '#d4edda' : kakaoError ? '#f8d7da' : '#d1ecf1',
          color: kakaoLoaded ? '#155724' : kakaoError ? '#721c24' : '#0c5460',
          border: `1px solid ${kakaoLoaded ? '#c3e6cb' : kakaoError ? '#f5c6cb' : '#bee5eb'}`
        }}>
          {kakaoLoaded ? '✅ 카카오 맵 API 로드 완료' : 
           kakaoError ? `❌ 카카오 맵 로드 실패: ${kakaoError}` : 
           '⏳ 카카오 맵 API 로딩 중...'}
        </div>

        {/* 검색 입력 */}
        <div style={{
          position: 'relative',
          marginBottom: '24px'
        }}>
          <input
            type="text"
            placeholder="장소명이나 주소를 입력하세요 (예: 강남역, 스타벅스)"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            disabled={!kakaoLoaded}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none',
              backgroundColor: 'white',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />

          {/* 검색 결과 드롭다운 */}
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              backgroundColor: 'white',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              maxHeight: '300px',
              overflowY: 'auto',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 1000
            }}>
              {searchResults.map((place, index) => (
                <div
                  key={index}
                  onClick={() => selectPlace(place)}
                  style={{
                    padding: '14px 16px',
                    cursor: 'pointer',
                    borderBottom: index < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                    backgroundColor: selectedResultIndex === index ? '#f0f9ff' : 'white',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    setSelectedResultIndex(index)
                    e.currentTarget.style.backgroundColor = '#f0f9ff'
                  }}
                  onMouseLeave={(e) => {
                    if (selectedResultIndex !== index) {
                      e.currentTarget.style.backgroundColor = 'white'
                    }
                  }}
                >
                  <div style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#1a1a1a',
                    marginBottom: '4px'
                  }}>
                    {place.place_name}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280'
                  }}>
                    {place.road_address_name || place.address_name}
                  </div>
                  {place.category_name && (
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginTop: '2px'
                    }}>
                      {place.category_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 검색 중 표시 */}
          {isSearching && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '3px solid #3b82f6',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}></div>
              <span>검색 중...</span>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}
        </div>

        {/* 테스트 버튼 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => handleSearchInput('강남역')}
            disabled={!kakaoLoaded}
            style={{
              padding: '12px 24px',
              backgroundColor: kakaoLoaded ? '#3b82f6' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: kakaoLoaded ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s'
            }}
          >
            테스트: 강남역
          </button>
          <button
            onClick={() => handleSearchInput('스타벅스 강남')}
            disabled={!kakaoLoaded}
            style={{
              padding: '12px 24px',
              backgroundColor: kakaoLoaded ? '#3b82f6' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: kakaoLoaded ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s'
            }}
          >
            테스트: 스타벅스 강남
          </button>
          <button
            onClick={() => handleSearchInput('서울특별시청')}
            disabled={!kakaoLoaded}
            style={{
              padding: '12px 24px',
              backgroundColor: kakaoLoaded ? '#3b82f6' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: kakaoLoaded ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s'
            }}
          >
            테스트: 서울특별시청
          </button>
          <button
            onClick={() => {
              setSearchQuery('')
              setSearchResults([])
              setLogs([])
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            초기화
          </button>
        </div>

        {/* 디버그 로그 */}
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#374151'
          }}>
            디버그 로그
          </h3>
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '13px'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#6b7280' }}>대기 중...</div>
            ) : (
              logs.map((log: any, index) => (
                <div
                  key={index}
                  style={{
                    padding: '4px 0',
                    color: log.type === 'error' ? '#dc2626' : 
                           log.type === 'success' ? '#16a34a' : '#374151'
                  }}
                >
                  {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}