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
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

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

  // Kakao Places API search - API 키 확인 및 수정
  const searchPlaces = useCallback((query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }
    
    // API 키가 환경변수에 있는지 확인
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_API_KEY || process.env.NEXT_PUBLIC_KAKAO_REST_KEY
    if (!apiKey) {
      console.error('Kakao API 키가 설정되지 않았습니다')
      return
    }
    
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      console.log('카카오 맵 API가 아직 로드되지 않았습니다')
      return
    }
    
    console.log('장소 검색 시작:', query)
    setIsSearching(true)
    
    try {
      const ps = new window.kakao.maps.services.Places()
      
      ps.keywordSearch(query, (data: any, status: any) => {
        setIsSearching(false)
        
        if (status === window.kakao.maps.services.Status.OK) {
          setSearchResults(data.slice(0, 5))
          console.log('검색 성공, 결과 개수:', data.length)
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          console.log('검색 결과가 없습니다')
          setSearchResults([])
        } else {
          console.error('검색 오류:', status)
          setSearchResults([])
        }
      })
    } catch (error) {
      console.error('장소 검색 중 오류:', error)
      setIsSearching(false)
      setSearchResults([])
    }
  }, [])

  // Handle search input with debouncing
  const handleSearchInput = (query: string) => {
    setSearchQuery(query)
    
    // 사용자가 입력한 값을 즉시 저장 (수동 입력 지원)
    if (currentPlanBox) {
      setCurrentPlanBox({
        ...currentPlanBox,
        placeName: query
      })
    }
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // 2글자 이상일 때 자동 검색
    if (query.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(query)
      }, 300)
    } else {
      setSearchResults([])
    }
  }

  // Select a place from search results
  const selectPlace = (place: Place) => {
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
    setSearchQuery(place.place_name)
    setSearchResults([])
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
            if (currentPlanBox) {
              setCurrentPlanBox(prev => prev ? {
                ...prev,
                address: address,
                placeName: prev.placeName || '선택한 위치'
              } : null)
            }
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
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type="text"
              value={currentPlanBox.title}
              onChange={(e) => setCurrentPlanBox({ ...currentPlanBox, title: e.target.value })}
              style={{
                flex: 1,
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                outline: 'none',
                padding: '4px'
              }}
              placeholder="제목을 입력하세요"
            />
            <select
              value={currentPlanBox.category}
              onChange={(e) => setCurrentPlanBox({ ...currentPlanBox, category: e.target.value })}
              style={{
                padding: '4px 8px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
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
            padding: '16px',
            backgroundColor: '#f9fafb'
          }}>
            {!isTransportation ? (
              <>
                {/* 통합 장소/주소 입력 섹션 */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    장소
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="주소나 장소를 입력하세요 (선택사항)"
                      value={searchQuery || currentPlanBox.placeName || ''}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 90px 8px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                    <button
                      onClick={() => setShowMap(!showMap)}
                      style={{
                        position: 'absolute',
                        right: '6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '5px 10px',
                        backgroundColor: showMap ? '#3b82f6' : 'white',
                        color: showMap ? 'white' : '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      지도 보기
                    </button>
                  </div>

                  {/* 검색 결과 자동 표시 */}
                  {searchResults.length > 0 && (
                    <div style={{
                      marginTop: '8px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      maxHeight: '150px',
                      overflowY: 'auto'
                    }}>
                      {searchResults.map((place, index) => (
                        <div
                          key={index}
                          onClick={() => selectPlace(place)}
                          style={{
                            padding: '8px 10px',
                            cursor: 'pointer',
                            borderBottom: index < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <div style={{ fontWeight: '500', fontSize: '13px' }}>{place.place_name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {place.road_address_name || place.address_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isSearching && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#6b7280',
                      textAlign: 'center'
                    }}>
                      검색 중...
                    </div>
                  )}
                </div>

                {/* 지도 표시 */}
                {showMap && (
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div id="modalMap" style={{
                      width: '100%',
                      height: '200px',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }} />
                  </div>
                )}

                {/* 시간 설정 */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {/* 시작시간 */}
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '6px'
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

                  {/* 종료시간 & 비용 */}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '6px'
                      }}>
                        종료시간
                      </label>
                      <div style={{
                        padding: '6px 8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        backgroundColor: '#f9fafb',
                        fontSize: '13px',
                        color: '#6b7280'
                      }}>
                        {calculateEndTime() || '미설정'}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '6px'
                      }}>
                        비용
                      </label>
                      <input
                        type="text"
                        value={currentPlanBox.cost}
                        onChange={(e) => setCurrentPlanBox({ ...currentPlanBox, cost: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                        placeholder="예: 10,000원"
                      />
                    </div>
                  </div>
                </div>

                {/* 메모 */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  padding: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
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
                      minHeight: '60px'
                    }}
                    placeholder="메모를 입력하세요"
                  />
                </div>
              </>
            ) : (
              /* 이동 모달 내용은 기존 유지 */
              <div>이동 설정 UI</div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '6px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </>
  )
}