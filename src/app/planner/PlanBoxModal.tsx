import { useState, useEffect, useRef, useCallback } from 'react'
import KakaoMapLoader, { isKakaoMapAvailable } from './KakaoMapLoader'

// 카카오 맵 API 타입 정의
declare global {
  interface Window {
    kakao: any;
  }
}

interface Place {
  place_name: string
  address_name: string
  road_address_name?: string
  phone?: string
  x: string // longitude
  y: string // latitude
  category_name?: string
}

interface PlanBox {
  id: number
  title: string
  category: string
  startHour: number | null
  startMinute: number | null
  durationHour: number
  durationMinute: number
  cost: string
  memo: string
  location?: string
  placeName?: string
  address?: string
  phoneNumber?: string
  hasTimeSet: boolean
  dayIndex?: number
  top?: number
  height?: number
  transportMode?: 'car' | 'public' | 'walk'
  routeInfo?: {
    origin: string
    destination: string
    distance: number
    duration: number
  }
}

interface PlanBoxModalProps {
  isOpen: boolean
  planBox: PlanBox | null
  onClose: () => void
  onSave: (planBox: PlanBox) => void
  placedBoxes?: PlanBox[]
}

// Helper function to check if a category is a transport category
const isTransportCategory = (category: string) => {
  const transportCategories = ['이동', 'transport']
  return transportCategories.includes(category)
}

export default function PlanBoxModal({ isOpen, planBox, onClose, onSave, placedBoxes = [] }: PlanBoxModalProps) {
  const [currentPlanBox, setCurrentPlanBox] = useState<PlanBox | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Place[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [kakaoLoaded, setKakaoLoaded] = useState(false)
  const [kakaoError, setKakaoError] = useState<string | null>(null)
  const [showPlaceConfirm, setShowPlaceConfirm] = useState(false)
  const [tempMapPlace, setTempMapPlace] = useState<{address: string, lat: number, lng: number} | null>(null)
  const [mapSearchQuery, setMapSearchQuery] = useState('')
  const [mapMarkers, setMapMarkers] = useState<any[]>([])
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(-1) // 키보드 네비게이션용
  const [isPlaceSelected, setIsPlaceSelected] = useState(false) // 장소 선택 플래그
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (planBox) {
      const boxToSet = { ...planBox }
      if (isTransportCategory(boxToSet.category) && !boxToSet.transportMode) {
        boxToSet.transportMode = 'car'
      }
      setCurrentPlanBox(boxToSet)
    }
  }, [planBox])

  // 카카오 맵 로드 핸들러
  const handleKakaoMapLoad = useCallback(() => {
    setKakaoLoaded(true)
    setKakaoError(null)
    console.log('[PlanBoxModal] 카카오 맵 로드 성공')
  }, [])

  const handleKakaoMapError = useCallback((error: string) => {
    setKakaoLoaded(false)
    setKakaoError(error)
    console.error('[PlanBoxModal] 카카오 맵 로드 실패:', error)
  }, [])

  // 카카오 맵이 로드되고 대기 중인 검색어가 있으면 검색 실행
  useEffect(() => {
    if (kakaoLoaded && searchQuery && searchQuery.length >= 2 && !isPlaceSelected) {
      console.log('[useEffect] 카카오 맵 로드 완료, 대기 중인 검색 실행:', searchQuery)
      searchPlaces(searchQuery)
    }
  }, [kakaoLoaded]) // searchQuery 의존성 제거 (무한 루프 방지)

  // Calculate end time automatically
  const calculateEndTime = useCallback(() => {
    if (!currentPlanBox || currentPlanBox.startHour === null || currentPlanBox.startMinute === null) {
      return ''
    }
    
    const totalMinutes = currentPlanBox.startHour * 60 + currentPlanBox.startMinute + 
                        currentPlanBox.durationHour * 60 + currentPlanBox.durationMinute
    const endHour = Math.floor(totalMinutes / 60)
    const endMinute = totalMinutes % 60
    
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
  }, [currentPlanBox])

  // Kakao Places API search
  const searchPlaces = useCallback((query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      setSelectedResultIndex(-1)
      return
    }
    
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      console.log('[searchPlaces] 카카오 맵 API가 아직 로드되지 않았습니다')
      console.log('[searchPlaces] window.kakao:', !!window.kakao)
      console.log('[searchPlaces] window.kakao.maps:', !!(window.kakao && window.kakao.maps))
      console.log('[searchPlaces] window.kakao.maps.services:', !!(window.kakao && window.kakao.maps && window.kakao.maps.services))
      console.log('[searchPlaces] kakaoLoaded state:', kakaoLoaded)
      return
    }
    
    console.log('[searchPlaces] 장소 검색 시작:', query)
    setIsSearching(true)
    
    try {
      const ps = new window.kakao.maps.services.Places()
      console.log('[searchPlaces] Places 서비스 생성 성공')
      
      ps.keywordSearch(query, (data: any, status: any) => {
        console.log('[searchPlaces] 검색 콜백 호출, 상태:', status)
        setIsSearching(false)
        
        if (status === window.kakao.maps.services.Status.OK) {
          console.log('[searchPlaces] 검색 성공, 결과 개수:', data.length)
          if (data.length > 0) {
            console.log('[searchPlaces] 첫 번째 결과:', data[0])
          }
          setSearchResults(data.slice(0, 5))
          setSelectedResultIndex(-1) // 새 검색 결과시 선택 초기화
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          console.log('[searchPlaces] 검색 결과가 없습니다')
          setSearchResults([])
          setSelectedResultIndex(-1)
        } else {
          console.error('[searchPlaces] 검색 오류:', status)
          setSearchResults([])
          setSelectedResultIndex(-1)
        }
      })
    } catch (error) {
      console.error('[searchPlaces] 장소 검색 중 오류:', error)
      setIsSearching(false)
      setSearchResults([])
      setSelectedResultIndex(-1)
    }
  }, [kakaoLoaded])

  // Handle search input with debouncing
  const handleSearchInput = (query: string) => {
    console.log('[handleSearchInput] 검색어 입력:', query)
    
    // 한번의 setState로 통합
    if (currentPlanBox) {
      setCurrentPlanBox({
        ...currentPlanBox,
        placeName: query
      })
    }
    
    // 검색어 상태만 별도로 관리 (재검색용)
    setSearchQuery(query)
    
    // 디바운싱 해제
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // 검색 결과 초기화
    if (!query || query.length < 2) {
      setSearchResults([])
      setSelectedResultIndex(-1)
      return
    }
    
    // 2글자 이상일 때 자동 검색
    if (query.length >= 2) {
      // 카카오 API 로드 체크
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
        console.log('[handleSearchInput] 카카오 API 미로드 상태, kakaoLoaded:', kakaoLoaded)
        return
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        console.log('[handleSearchInput] 디바운스 후 검색 실행:', query)
        searchPlaces(query)
      }, 200) // 빠른 응답을 위해 200ms 딜레이
    }
  }

  // Select a place from search results
  const selectPlace = (place: Place) => {
    console.log('[selectPlace] 장소 선택:', place.place_name)
    
    // 모든 검색 관련 타이머 취소
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // 장소 선택 플래그 설정 (재검색 방지)
    setIsPlaceSelected(true)
    
    // 먼저 검색 결과를 즉시 초기화
    setSearchResults([])
    setSelectedResultIndex(-1)
    setSearchQuery('') // 검색어도 초기화
    
    // 선택된 장소 정보 설정
    if (currentPlanBox) {
      setCurrentPlanBox({
        ...currentPlanBox,
        placeName: place.place_name,
        address: place.road_address_name || place.address_name,
        phoneNumber: place.phone || '',
        location: place.road_address_name || place.address_name
      })
      setSelectedPlace(place)
    }
    
    // 500ms 후 플래그 리셋 (다음 검색 가능하도록)
    setTimeout(() => {
      setIsPlaceSelected(false)
    }, 500)
  }

  // 지도 초기화
  const initializeMap = useCallback(() => {
    if (!showMap || !window.kakao || !window.kakao.maps) {
      return
    }

    const container = document.getElementById('modalMap')
    if (!container) {
      return
    }

    try {
      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780),
        level: 3
      }

      mapRef.current = new window.kakao.maps.Map(container, options)
      
      // 클릭 이벤트 추가
      window.kakao.maps.event.addListener(mapRef.current, 'click', function(mouseEvent: any) {
        const latlng = mouseEvent.latLng
        
        if (markerRef.current) {
          markerRef.current.setMap(null)
        }
        
        markerRef.current = new window.kakao.maps.Marker({
          position: latlng,
          map: mapRef.current
        })
        
        // 주소 검색
        const geocoder = new window.kakao.maps.services.Geocoder()
        geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const address = result[0].address.address_name
            setTempMapPlace({
              address: address,
              lat: latlng.getLat(),
              lng: latlng.getLng()
            })
            setShowPlaceConfirm(true)
          }
        })
      })
    } catch (error) {
      console.error('지도 초기화 오류:', error)
    }
  }, [showMap, currentPlanBox])

  useEffect(() => {
    if (showMap) {
      setTimeout(initializeMap, 100)
    }
  }, [showMap, initializeMap])

  const handleSave = () => {
    if (currentPlanBox) {
      onSave(currentPlanBox)
      onClose()
    }
  }

  if (!isOpen || !currentPlanBox) return null

  const isTransportation = isTransportCategory(currentPlanBox.category)

  // 지도 장소 선택 확인 핸들러
  const confirmMapPlace = () => {
    if (tempMapPlace && currentPlanBox) {
      setCurrentPlanBox({
        ...currentPlanBox,
        placeName: currentPlanBox.placeName || '선택한 위치',
        address: tempMapPlace.address,
        location: tempMapPlace.address
      })
      setShowPlaceConfirm(false)
      setTempMapPlace(null)
    }
  }

  const cancelMapPlace = () => {
    setShowPlaceConfirm(false)
    setTempMapPlace(null)
    // 마커 제거
    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }
  }

  return (
    <>
      <KakaoMapLoader onLoad={handleKakaoMapLoad} onError={handleKakaoMapError} />
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '90%',
          maxWidth: '680px',
          height: '90vh',
          maxHeight: '800px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#f8f9fa'
          }}>
            <input
              type="text"
              value={currentPlanBox.title}
              onChange={(e) => setCurrentPlanBox({ ...currentPlanBox, title: e.target.value })}
              style={{
                flex: 1,
                fontSize: '20px',
                fontWeight: '600',
                border: '1px solid transparent',
                outline: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'white',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = 'transparent'}
              placeholder="제목을 입력하세요"
            />
            <select
              value={currentPlanBox.category}
              onChange={(e) => setCurrentPlanBox({ ...currentPlanBox, category: e.target.value })}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: 'white',
                minWidth: '100px'
              }}
            >
              <option value="관광">관광</option>
              <option value="식사">식사</option>
              <option value="카페">카페</option>
              <option value="쇼핑">쇼핑</option>
              <option value="숙소">숙소</option>
              <option value="액티비티">액티비티</option>
              <option value="이동">이동</option>
              <option value="기타">기타</option>
            </select>
            <button
              onClick={onClose}
              style={{
                color: '#6b7280',
                fontSize: '24px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 4px'
              }}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: '#ffffff'
          }}>
            {!isTransportation ? (
              <>
                {/* 장소 입력 섹션 */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '1px solid #e5e7eb',
                  position: 'relative'
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '12px'
                  }}>
                    장소 입력 (선택)
                  </label>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="장소명이나 주소를 입력하세요"
                        value={currentPlanBox.placeName || ''}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (!searchResults.length) return
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            setSelectedResultIndex(prev => 
                              prev < searchResults.length - 1 ? prev + 1 : 0
                            )
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            setSelectedResultIndex(prev => 
                              prev > 0 ? prev - 1 : searchResults.length - 1
                            )
                          } else if (e.key === 'Enter' && selectedResultIndex >= 0) {
                            e.preventDefault()
                            selectPlace(searchResults[selectedResultIndex])
                            setSelectedResultIndex(-1)
                          } else if (e.key === 'Escape') {
                            setSearchResults([])
                            setSelectedResultIndex(-1)
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          paddingRight: searchResults.length > 0 ? '40px' : '16px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '15px',
                          outline: 'none',
                          backgroundColor: 'white',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6'
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db'
                          e.target.style.boxShadow = 'none'
                          // 약간의 지연을 두어 드롭다운 클릭이 처리되도록 함
                          setTimeout(() => {
                            if (searchResults.length > 0 && !e.relatedTarget?.closest('.search-dropdown')) {
                              setSearchResults([])
                              setSelectedResultIndex(-1)
                            }
                          }, 200)
                        }}
                      />
                      {searchResults.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          color: '#6b7280',
                          fontSize: '12px',
                          backgroundColor: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: '500'
                        }}>
                          {searchResults.length}개 검색됨
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setShowMap(!showMap)
                        if (showMap) {
                          markersRef.current.forEach(marker => {
                            if (marker.infowindow) marker.infowindow.close()
                            marker.setMap(null)
                          })
                          markersRef.current = []
                          setMapSearchQuery('')
                        }
                      }}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: showMap ? '#ef4444' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        minWidth: '140px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = showMap ? '#dc2626' : '#2563eb'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = showMap ? '#ef4444' : '#3b82f6'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>🗺️</span>
                      <span>{showMap ? '지도 닫기' : '지도 찾기'}</span>
                    </button>
                  </div>

                  {/* 검색 결과 드롭다운 */}
                  {searchResults.length > 0 && (
                    <div 
                      className="search-dropdown"
                      style={{
                        position: 'absolute',
                        top: 'auto',
                        left: '20px',
                        right: '20px',
                        marginTop: '-8px',
                        backgroundColor: 'white',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        maxHeight: '240px',
                        overflowY: 'auto',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        zIndex: 1000,
                        animation: 'slideDown 0.2s ease-out'
                      }}>
                      <style>{`
                        @keyframes slideDown {
                          from {
                            opacity: 0;
                            transform: translateY(-10px);
                          }
                          to {
                            opacity: 1;
                            transform: translateY(0);
                          }
                        }
                      `}</style>
                      {searchResults.map((place, index) => (
                        <div
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation()
                            selectPlace(place)
                            setSelectedResultIndex(-1)
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          style={{
                            padding: '14px 16px',
                            cursor: 'pointer',
                            borderBottom: index < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            position: 'relative',
                            backgroundColor: selectedResultIndex === index ? '#f0f9ff' : 'white',
                            paddingLeft: selectedResultIndex === index ? '20px' : '16px'
                          }}
                          onMouseEnter={(e) => {
                            setSelectedResultIndex(index)
                            e.currentTarget.style.backgroundColor = '#f0f9ff'
                            e.currentTarget.style.paddingLeft = '20px'
                          }}
                          onMouseLeave={(e) => {
                            if (selectedResultIndex !== index) {
                              e.currentTarget.style.backgroundColor = 'white'
                              e.currentTarget.style.paddingLeft = '16px'
                            }
                          }}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#eff6ff',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontSize: '16px'
                          }}>
                            📍
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '600', 
                              fontSize: '14px', 
                              color: '#1a1a1a',
                              marginBottom: '2px'
                            }}>
                              {place.place_name}
                            </div>
                            <div style={{ 
                              fontSize: '13px', 
                              color: '#6b7280',
                              lineHeight: '1.4'
                            }}>
                              {place.road_address_name || place.address_name}
                            </div>
                            {place.category_name && (
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#9ca3af', 
                                marginTop: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span style={{ fontSize: '10px' }}>▸</span>
                                {place.category_name}
                              </div>
                            )}
                          </div>
                          <div style={{
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            fontSize: '12px',
                            color: '#3b82f6',
                            fontWeight: '500',
                            ...(index === 0 && { opacity: 0.7 }) // 첫 번째 항목에 힌트 표시
                          }}
                          className="select-hint"
                          >
                            선택
                          </div>
                          <style>{`
                            div:hover .select-hint {
                              opacity: 1 !important;
                            }
                          `}</style>
                        </div>
                      ))}
                    </div>
                  )}

                  {isSearching && (
                    <div style={{
                      position: 'absolute',
                      top: 'auto',
                      left: '20px',
                      right: '20px',
                      marginTop: '-8px',
                      backgroundColor: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      zIndex: 999
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '3px solid #3b82f6',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }}></div>
                      <span style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        검색 중...
                      </span>
                      <style>{`
                        @keyframes spin {
                          to { transform: rotate(360deg); }
                        }
                      `}</style>
                    </div>
                  )}

                </div>

                {/* 지도 표시 */}
                {showMap && (
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px',
                    border: '2px solid #3b82f6',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}>
                    {/* 지도 검색 입력 */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginRight: '8px',
                          whiteSpace: 'nowrap'
                        }}>
                          지도검색
                        </label>
                        <input
                          type="text"
                          placeholder="예) 지역 + 음식점"
                          value={mapSearchQuery}
                          onChange={(e) => setMapSearchQuery(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            border: '2px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && mapSearchQuery && window.kakao && window.kakao.maps && mapRef.current) {
                              const ps = new window.kakao.maps.services.Places()
                              
                              // 기존 마커들 제거
                              markersRef.current.forEach(marker => marker.setMap(null))
                              markersRef.current = []
                              
                              ps.keywordSearch(mapSearchQuery, (data: any, status: any) => {
                                if (status === window.kakao.maps.services.Status.OK) {
                                  const bounds = new window.kakao.maps.LatLngBounds()
                                  
                                  // 검색 결과를 마커로 표시 (최대 10개)
                                  data.slice(0, 10).forEach((place: any, index: number) => {
                                    const placePosition = new window.kakao.maps.LatLng(place.y, place.x)
                                    
                                    // 마커 생성
                                    const marker = new window.kakao.maps.Marker({
                                      position: placePosition,
                                      map: mapRef.current,
                                      title: place.place_name
                                    })
                                    
                                    // 인포윈도우 생성
                                    const infowindow = new window.kakao.maps.InfoWindow({
                                      content: `
                                        <div style="padding: 8px; min-width: 200px;">
                                          <div style="font-weight: bold; margin-bottom: 4px;">${place.place_name}</div>
                                          <div style="font-size: 12px; color: #666;">${place.road_address_name || place.address_name}</div>
                                          ${place.phone ? `<div style="font-size: 12px; color: #666;">${place.phone}</div>` : ''}
                                          <button onclick="window.selectMapPlace${index}()" style="
                                            margin-top: 8px;
                                            padding: 4px 8px;
                                            background: #3b82f6;
                                            color: white;
                                            border: none;
                                            border-radius: 4px;
                                            cursor: pointer;
                                            font-size: 12px;
                                          ">이 장소 선택</button>
                                        </div>
                                      `,
                                      removable: true
                                    })
                                    
                                    // 전역 함수로 선택 처리
                                    ;(window as any)[`selectMapPlace${index}`] = () => {
                                      setCurrentPlanBox({
                                        ...currentPlanBox,
                                        placeName: place.place_name,
                                        address: place.road_address_name || place.address_name,
                                        phoneNumber: place.phone || ''
                                      })
                                      infowindow.close()
                                      // 모든 인포윈도우 닫기
                                      markersRef.current.forEach(m => {
                                        if (m.infowindow) m.infowindow.close()
                                      })
                                    }
                                    
                                    // 마커 클릭 이벤트
                                    window.kakao.maps.event.addListener(marker, 'click', () => {
                                      // 다른 인포윈도우 모두 닫기
                                      markersRef.current.forEach(m => {
                                        if (m.infowindow) m.infowindow.close()
                                      })
                                      infowindow.open(mapRef.current, marker)
                                    })
                                    
                                    // 마커와 인포윈도우 저장
                                    marker.infowindow = infowindow
                                    markersRef.current.push(marker)
                                    
                                    bounds.extend(placePosition)
                                  })
                                  
                                  // 지도 범위 조정
                                  mapRef.current.setBounds(bounds)
                                  
                                  // 첫 번째 마커의 인포윈도우 자동 열기
                                  if (markersRef.current[0] && markersRef.current[0].infowindow) {
                                    markersRef.current[0].infowindow.open(mapRef.current, markersRef.current[0])
                                  }
                                } else {
                                  alert('검색 결과가 없습니다.')
                                }
                              })
                            }
                          }}
                        />
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        textAlign: 'center'
                      }}>
                        지도를 검색하거나 클릭하여 장소를 선택하세요
                      </div>
                    </div>
                    <div id="modalMap" style={{
                      width: '100%',
                      height: '300px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #e5e7eb'
                    }} />
                  </div>
                )}

                {/* 주소 및 연락처 정보 */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      주소
                    </label>
                    <input
                      type="text"
                      value={currentPlanBox.address || ''}
                      onChange={(e) => setCurrentPlanBox({ ...currentPlanBox, address: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: currentPlanBox.address ? '#f0f9ff' : 'white'
                      }}
                      placeholder="주소가 자동으로 입력됩니다"
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      연락처
                    </label>
                    <input
                      type="text"
                      value={currentPlanBox.phoneNumber || ''}
                      onChange={(e) => setCurrentPlanBox({ ...currentPlanBox, phoneNumber: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: currentPlanBox.phoneNumber ? '#f0f9ff' : 'white'
                      }}
                      placeholder="연락처가 자동으로 입력됩니다"
                    />
                  </div>
                </div>

                {/* 시간 설정 */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '16px'
                  }}>
                    시간 설정
                  </h3>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    {/* 시작시간 */}
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        시작시간
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select
                          value={currentPlanBox.startHour ?? ''}
                          onChange={(e) => setCurrentPlanBox({
                            ...currentPlanBox,
                            startHour: e.target.value ? parseInt(e.target.value) : null,
                            hasTimeSet: true
                          })}
                          style={{
                            flex: 1,
                            padding: '6px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">시</option>
                          {[...Array(24)].map((_, i) => (
                            <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                          ))}
                        </select>
                        <select
                          value={currentPlanBox.startMinute ?? ''}
                          onChange={(e) => setCurrentPlanBox({
                            ...currentPlanBox,
                            startMinute: e.target.value ? parseInt(e.target.value) : null,
                            hasTimeSet: true
                          })}
                          style={{
                            flex: 1,
                            padding: '6px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">분</option>
                          {[0, 10, 20, 30, 40, 50].map((min) => (
                            <option key={min} value={min}>{String(min).padStart(2, '0')}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 소요시간 */}
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '6px'
                      }}>
                        소요시간
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select
                          value={currentPlanBox.durationHour}
                          onChange={(e) => setCurrentPlanBox({
                            ...currentPlanBox,
                            durationHour: parseInt(e.target.value) || 0
                          })}
                          style={{
                            flex: 1,
                            padding: '6px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          {[...Array(13)].map((_, i) => (
                            <option key={i} value={i}>{i}시간</option>
                          ))}
                        </select>
                        <select
                          value={currentPlanBox.durationMinute}
                          onChange={(e) => setCurrentPlanBox({
                            ...currentPlanBox,
                            durationMinute: parseInt(e.target.value) || 0
                          })}
                          style={{
                            flex: 1,
                            padding: '6px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          {[0, 10, 20, 30, 40, 50].map((min) => (
                            <option key={min} value={min}>{min}분</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 종료시간 표시 */}
                  {(currentPlanBox.startHour !== null && currentPlanBox.startMinute !== null) && (
                    <div style={{ 
                      marginTop: '20px',
                      padding: '12px',
                      backgroundColor: '#e0f2fe',
                      borderRadius: '6px',
                      border: '1px solid #7dd3fc'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#0369a1' }}>종료 시간:</span>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#0c4a6e' }}>
                          {calculateEndTime()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 비용 섹션 */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '1px solid #e5e7eb'
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '12px'
                  }}>
                    비용
                  </label>
                  <input
                    type="text"
                    value={currentPlanBox.cost}
                    onChange={(e) => setCurrentPlanBox({ ...currentPlanBox, cost: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '15px',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                    placeholder="예: 10,000원"
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* 메모 */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #e5e7eb'
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '12px'
                  }}>
                    메모
                  </label>
                  <textarea
                    value={currentPlanBox.memo}
                    onChange={(e) => setCurrentPlanBox({ ...currentPlanBox, memo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '100px'
                    }}
                    placeholder="메모를 입력하세요"
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </>
            ) : (
              /* 이동 전용 UI */
              <>
                {/* 이동 수단 선택 */}
                <div style={{
                  backgroundColor: '#f0f9ff',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '2px solid #0ea5e9',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '100px',
                    height: '100px',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    borderRadius: '50%',
                    opacity: 0.1
                  }} />
                  
                  <label style={{
                    display: 'block',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#0369a1',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '20px' }}>🚀</span>
                    이동 수단 선택
                  </label>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '12px'
                  }}>
                    {[
                      { id: 'car', icon: '🚗', label: '자동차', time: '빠름', color: '#ef4444' },
                      { id: 'public', icon: '🚇', label: '대중교통', time: '보통', color: '#3b82f6' },
                      { id: 'walk', icon: '🚶', label: '도보', time: '느림', color: '#10b981' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setCurrentPlanBox({ 
                          ...currentPlanBox, 
                          transportMode: mode.id as 'car' | 'public' | 'walk' 
                        })}
                        style={{
                          padding: '16px 12px',
                          borderRadius: '10px',
                          border: currentPlanBox.transportMode === mode.id 
                            ? `3px solid ${mode.color}` 
                            : '2px solid #e5e7eb',
                          backgroundColor: currentPlanBox.transportMode === mode.id
                            ? `${mode.color}15`
                            : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          position: 'relative',
                          overflow: 'hidden',
                          transform: currentPlanBox.transportMode === mode.id ? 'scale(1.05)' : 'scale(1)'
                        }}
                        onMouseEnter={(e) => {
                          if (currentPlanBox.transportMode !== mode.id) {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentPlanBox.transportMode !== mode.id) {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }
                        }}
                      >
                        {currentPlanBox.transportMode === mode.id && (
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '20px',
                            height: '20px',
                            backgroundColor: mode.color,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'checkPop 0.3s ease-out'
                          }}>
                            <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                          </div>
                        )}
                        <span style={{ fontSize: '28px' }}>{mode.icon}</span>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: currentPlanBox.transportMode === mode.id ? '600' : '500',
                          color: currentPlanBox.transportMode === mode.id ? mode.color : '#374151'
                        }}>
                          {mode.label}
                        </span>
                        <span style={{ 
                          fontSize: '11px', 
                          color: '#6b7280',
                          backgroundColor: '#f3f4f6',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          {mode.time}
                        </span>
                      </button>
                    ))}
                  </div>
                  <style>{`
                    @keyframes checkPop {
                      0% { transform: scale(0) rotate(-180deg); }
                      50% { transform: scale(1.2) rotate(10deg); }
                      100% { transform: scale(1) rotate(0deg); }
                    }
                  `}</style>
                </div>

                {/* 출발지/도착지 입력 */}
                <div style={{
                  backgroundColor: '#fefce8',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '2px solid #facc15',
                  position: 'relative'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <span style={{ fontSize: '20px' }}>📍</span>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#713f12',
                      margin: 0
                    }}>
                      경로 설정
                    </h3>
                  </div>

                  {/* 출발지 입력 */}
                  <div style={{ marginBottom: '16px', position: 'relative' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#713f12',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>출</div>
                      출발지
                    </label>
                    <input
                      type="text"
                      placeholder="출발 장소를 입력하세요"
                      value={currentPlanBox.routeInfo?.origin || ''}
                      onChange={(e) => setCurrentPlanBox({
                        ...currentPlanBox,
                        routeInfo: {
                          ...currentPlanBox.routeInfo,
                          origin: e.target.value,
                          destination: currentPlanBox.routeInfo?.destination || '',
                          distance: currentPlanBox.routeInfo?.distance || 0,
                          duration: currentPlanBox.routeInfo?.duration || 0
                        }
                      })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        paddingLeft: '44px',
                        border: '2px solid #fde047',
                        borderRadius: '8px',
                        fontSize: '15px',
                        outline: 'none',
                        backgroundColor: 'white',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#facc15'
                        e.target.style.boxShadow = '0 0 0 3px rgba(250, 204, 21, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#fde047'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      bottom: '14px',
                      fontSize: '18px'
                    }}>🏁</span>
                  </div>

                  {/* 화살표 연결선 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '8px 0',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '2px',
                      height: '30px',
                      background: 'linear-gradient(180deg, #10b981 0%, #3b82f6 100%)',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderStyle: 'solid',
                        borderWidth: '6px 4px 0 4px',
                        borderColor: '#3b82f6 transparent transparent transparent'
                      }} />
                    </div>
                    {currentPlanBox.transportMode && (
                      <div style={{
                        position: 'absolute',
                        backgroundColor: 'white',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{currentPlanBox.transportMode === 'car' ? '🚗' : currentPlanBox.transportMode === 'public' ? '🚇' : '🚶'}</span>
                        <span>
                          {currentPlanBox.routeInfo?.duration ? 
                            `약 ${Math.round(currentPlanBox.routeInfo.duration)}분` : 
                            '경로 계산 중...'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 도착지 입력 */}
                  <div style={{ position: 'relative' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#713f12',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>도</div>
                      도착지
                    </label>
                    <input
                      type="text"
                      placeholder="도착 장소를 입력하세요"
                      value={currentPlanBox.routeInfo?.destination || ''}
                      onChange={(e) => setCurrentPlanBox({
                        ...currentPlanBox,
                        routeInfo: {
                          ...currentPlanBox.routeInfo,
                          origin: currentPlanBox.routeInfo?.origin || '',
                          destination: e.target.value,
                          distance: currentPlanBox.routeInfo?.distance || 0,
                          duration: currentPlanBox.routeInfo?.duration || 0
                        }
                      })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        paddingLeft: '44px',
                        border: '2px solid #fde047',
                        borderRadius: '8px',
                        fontSize: '15px',
                        outline: 'none',
                        backgroundColor: 'white',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#facc15'
                        e.target.style.boxShadow = '0 0 0 3px rgba(250, 204, 21, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#fde047'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      bottom: '14px',
                      fontSize: '18px'
                    }}>📌</span>
                  </div>

                  {/* 자동 채우기 버튼 */}
                  <button
                    onClick={() => {
                      // 이전/다음 박스에서 장소 정보 자동 가져오기
                      const currentIndex = placedBoxes.findIndex(box => box.id === currentPlanBox.id)
                      if (currentIndex > 0 && currentIndex < placedBoxes.length - 1) {
                        const prevBox = placedBoxes[currentIndex - 1]
                        const nextBox = placedBoxes[currentIndex + 1]
                        
                        if (prevBox.placeName || nextBox.placeName) {
                          setCurrentPlanBox({
                            ...currentPlanBox,
                            routeInfo: {
                              origin: prevBox.placeName || prevBox.address || '',
                              destination: nextBox.placeName || nextBox.address || '',
                              distance: 0,
                              duration: 30 // 기본값
                            }
                          })
                        }
                      }
                    }}
                    style={{
                      marginTop: '16px',
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#fef3c7',
                      border: '2px dashed #fbbf24',
                      borderRadius: '8px',
                      color: '#78350f',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fde68a'
                      e.currentTarget.style.borderStyle = 'solid'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef3c7'
                      e.currentTarget.style.borderStyle = 'dashed'
                    }}
                  >
                    <span>🪄</span>
                    이전/다음 일정에서 자동으로 가져오기
                  </button>
                </div>

                {/* 예상 정보 표시 */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '1px solid #7dd3fc'
                }}>
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#0369a1',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>📊</span>
                    예상 이동 정보
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{
                      backgroundColor: 'white',
                      padding: '14px',
                      borderRadius: '8px',
                      border: '1px solid #e0f2fe'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#64748b',
                        marginBottom: '4px',
                        fontWeight: '500'
                      }}>
                        예상 거리
                      </div>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: '600',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '4px'
                      }}>
                        {currentPlanBox.routeInfo?.distance ? 
                          `${(currentPlanBox.routeInfo.distance / 1000).toFixed(1)}` : 
                          '0.0'
                        }
                        <span style={{ fontSize: '14px', fontWeight: '400' }}>km</span>
                      </div>
                    </div>
                    
                    <div style={{
                      backgroundColor: 'white',
                      padding: '14px',
                      borderRadius: '8px',
                      border: '1px solid #e0f2fe'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#64748b',
                        marginBottom: '4px',
                        fontWeight: '500'
                      }}>
                        예상 시간
                      </div>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: '600',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '4px'
                      }}>
                        {currentPlanBox.routeInfo?.duration ? 
                          Math.round(currentPlanBox.routeInfo.duration) : 
                          '0'
                        }
                        <span style={{ fontSize: '14px', fontWeight: '400' }}>분</span>
                      </div>
                    </div>
                  </div>

                  {/* 경로 계산 버튼 */}
                  <button
                    onClick={() => {
                      // 실제 경로 계산 로직 (카카오맵 API 활용)
                      if (currentPlanBox.routeInfo?.origin && currentPlanBox.routeInfo?.destination) {
                        // 임시 계산값 설정 (실제로는 API 호출)
                        const mockDistance = Math.random() * 10000 + 1000
                        const mockDuration = Math.random() * 60 + 10
                        
                        setCurrentPlanBox({
                          ...currentPlanBox,
                          routeInfo: {
                            ...currentPlanBox.routeInfo,
                            distance: mockDistance,
                            duration: mockDuration
                          },
                          durationHour: Math.floor(mockDuration / 60),
                          durationMinute: Math.round(mockDuration % 60)
                        })
                      }
                    }}
                    style={{
                      marginTop: '16px',
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.3)'
                    }}
                    disabled={!currentPlanBox.routeInfo?.origin || !currentPlanBox.routeInfo?.destination}
                  >
                    <span>🗺️</span>
                    경로 계산하기
                  </button>
                </div>

                {/* 시간 설정 */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '16px'
                  }}>
                    시간 설정
                  </h3>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    {/* 시작시간 */}
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        출발 시간
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select
                          value={currentPlanBox.startHour ?? ''}
                          onChange={(e) => setCurrentPlanBox({
                            ...currentPlanBox,
                            startHour: e.target.value ? parseInt(e.target.value) : null,
                            hasTimeSet: true
                          })}
                          style={{
                            flex: 1,
                            padding: '6px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">시</option>
                          {[...Array(24)].map((_, i) => (
                            <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                          ))}
                        </select>
                        <select
                          value={currentPlanBox.startMinute ?? ''}
                          onChange={(e) => setCurrentPlanBox({
                            ...currentPlanBox,
                            startMinute: e.target.value ? parseInt(e.target.value) : null,
                            hasTimeSet: true
                          })}
                          style={{
                            flex: 1,
                            padding: '6px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">분</option>
                          {[0, 10, 20, 30, 40, 50].map((min) => (
                            <option key={min} value={min}>{String(min).padStart(2, '0')}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 소요시간 */}
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '6px'
                      }}>
                        소요시간
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select
                          value={currentPlanBox.durationHour}
                          onChange={(e) => setCurrentPlanBox({
                            ...currentPlanBox,
                            durationHour: parseInt(e.target.value) || 0
                          })}
                          style={{
                            flex: 1,
                            padding: '6px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          {[...Array(13)].map((_, i) => (
                            <option key={i} value={i}>{i}시간</option>
                          ))}
                        </select>
                        <select
                          value={currentPlanBox.durationMinute}
                          onChange={(e) => setCurrentPlanBox({
                            ...currentPlanBox,
                            durationMinute: parseInt(e.target.value) || 0
                          })}
                          style={{
                            flex: 1,
                            padding: '6px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          {[0, 10, 20, 30, 40, 50].map((min) => (
                            <option key={min} value={min}>{min}분</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 도착 예정 시간 표시 */}
                  {(currentPlanBox.startHour !== null && currentPlanBox.startMinute !== null) && (
                    <div style={{ 
                      marginTop: '20px',
                      padding: '12px',
                      background: 'linear-gradient(90deg, #dcfce7 0%, #d9f99d 100%)',
                      borderRadius: '6px',
                      border: '1px solid #84cc16'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#365314' }}>도착 예정:</span>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#166534' }}>
                          {calculateEndTime()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 메모 */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #e5e7eb'
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '12px'
                  }}>
                    메모
                  </label>
                  <textarea
                    value={currentPlanBox.memo}
                    onChange={(e) => setCurrentPlanBox({ ...currentPlanBox, memo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '80px'
                    }}
                    placeholder="이동 경로 상세 정보, 교통편 예약 정보 등을 입력하세요"
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: '#f8f9fa'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ffffff',
                color: '#374151',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
      
      {/* 지도 장소 선택 확인 모달 */}
      {showPlaceConfirm && tempMapPlace && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1a1a1a'
            }}>
              이 곳을 선택하시겠습니까?
            </h3>
            <div style={{
              padding: '16px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #3b82f6'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#374151',
                fontWeight: '500'
              }}>
                📍 {tempMapPlace.address}
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelMapPlace}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              >
                취소
              </button>
              <button
                onClick={confirmMapPlace}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                선택
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}