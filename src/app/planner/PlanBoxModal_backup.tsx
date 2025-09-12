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

// Helper function to check if a category is a non-transport (place) category
const isPlaceCategory = (category: string) => {
  const placeCategories = ['관광', '식사', '카페', '쇼핑', '숙소', '액티비티', '기타', 
                          'sightseeing', 'food', 'activity', 'shopping', 'accommodation']
  return placeCategories.includes(category)
}

// Ultra Compact Inline Edit Component
const InlineEdit = ({ 
  value, 
  onChange, 
  placeholder = '입력', 
  type = 'text',
  prefix,
  suffix,
  multiline = false,
  readOnly = false,
  style = {}
}: {
  value: string | number
  onChange?: (value: string) => void
  placeholder?: string
  type?: 'text' | 'number' | 'time'
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  multiline?: boolean
  readOnly?: boolean
  style?: React.CSSProperties
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setTempValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if ('select' in inputRef.current) {
        inputRef.current.select()
      }
    }
  }, [isEditing])

  const handleSave = () => {
    if (onChange && tempValue !== value) {
      onChange(String(tempValue))
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setTempValue(value)
      setIsEditing(false)
    }
  }

  if (readOnly) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        color: '#6b7280',
        ...style
      }}>
        {prefix}
        <span>{value || '-'}</span>
        {suffix}
      </div>
    )
  }

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input'
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', ...style }}>
        {prefix}
        <InputComponent
          ref={inputRef as any}
          type={type}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          style={{
            border: '1px solid #3b82f6',
            borderRadius: '3px',
            padding: multiline ? '3px 4px' : '1px 4px',
            outline: 'none',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            backgroundColor: 'white',
            minWidth: multiline ? '100%' : '40px',
            minHeight: multiline ? '40px' : 'auto',
            resize: multiline ? 'vertical' : 'none',
            boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.2)',
            ...style
          }}
        />
        {suffix}
      </div>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        cursor: 'pointer',
        padding: '1px 4px',
        borderRadius: '3px',
        transition: 'all 0.1s',
        border: '1px solid transparent',
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f3f4f6'
        e.currentTarget.style.borderColor = '#e5e7eb'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
      }}
    >
      {prefix}
      <span style={{ color: value ? 'inherit' : '#9ca3af' }}>
        {value || placeholder}
      </span>
      {suffix}
    </div>
  )
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
  const markersRef = useRef<any[]>([])
  const infowindowRef = useRef<any>(null)

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
  }, [])

  const handleKakaoMapError = useCallback((error: string) => {
    setKakaoLoaded(false)
    setKakaoError(error)
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

  // Kakao Places API search
  const searchPlaces = useCallback((query: string) => {
    if (!query || !kakaoLoaded || !window.kakao?.maps?.services) {
      return
    }
    
    setIsSearching(true)
    
    try {
      const ps = new window.kakao.maps.services.Places()
      
      ps.keywordSearch(query, (data: any, status: any) => {
        setIsSearching(false)
        
        if (status === window.kakao.maps.services.Status.OK) {
          setSearchResults(data.slice(0, 5))
        } else {
          setSearchResults([])
        }
      })
    } catch (error) {
      setIsSearching(false)
      setSearchResults([])
    }
  }, [kakaoLoaded])

  // Handle search input with debouncing
  const handleSearchInput = (query: string) => {
    setSearchQuery(query)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (query.length > 1) {
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
    setSearchQuery('')
    setSearchResults([])
    setShowMap(false)
  }

  // Calculate route for transportation
  const calculateRoute = useCallback(async () => {
    if (!currentPlanBox || !isTransportCategory(currentPlanBox.category)) {
      return
    }

    if (!placedBoxes || placedBoxes.length === 0) {
      alert('타임라인에 배치된 박스가 없습니다.')
      return
    }

    const sortedBoxes = [...placedBoxes].sort((a, b) => {
      if (a.dayIndex !== b.dayIndex) {
        return (a.dayIndex || 0) - (b.dayIndex || 0)
      }
      return (a.top || 0) - (b.top || 0)
    })

    const currentIndex = sortedBoxes.findIndex(box => box.id === currentPlanBox.id)
    
    if (currentIndex === -1) {
      alert('현재 박스를 타임라인에서 찾을 수 없습니다.')
      return
    }

    let prevBox = null
    let nextBox = null
    
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!isTransportCategory(sortedBoxes[i].category)) {
        prevBox = sortedBoxes[i]
        break
      }
    }
    
    for (let i = currentIndex + 1; i < sortedBoxes.length; i++) {
      if (!isTransportCategory(sortedBoxes[i].category)) {
        nextBox = sortedBoxes[i]
        break
      }
    }

    if (!prevBox || !nextBox) {
      alert('이동 박스 위아래에 장소 정보가 있는 박스가 필요합니다.')
      return
    }

    const origin = prevBox.address || prevBox.placeName || prevBox.location || prevBox.title || ''
    const destination = nextBox.address || nextBox.placeName || nextBox.location || nextBox.title || ''
    
    if (!origin || !destination) {
      alert('인접 박스에 장소 정보가 필요합니다.')
      return
    }
    
    const transportMode = currentPlanBox.transportMode || 'car'
    
    try {
      if (!window.kakao?.maps) {
        throw new Error('카카오 맵 API가 로드되지 않았습니다.')
      }
      
      const getCoordinates = (address: string): Promise<{lat: number, lng: number}> => {
        return new Promise((resolve, reject) => {
          const ps = new window.kakao.maps.services.Places()
          
          ps.keywordSearch(address, (data: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
              resolve({ 
                lat: parseFloat(data[0].y), 
                lng: parseFloat(data[0].x) 
              })
            } else {
              const geocoder = new window.kakao.maps.services.Geocoder()
              geocoder.addressSearch(address, (result: any, status: any) => {
                if (status === window.kakao.maps.services.Status.OK) {
                  resolve({ 
                    lat: parseFloat(result[0].y), 
                    lng: parseFloat(result[0].x) 
                  })
                } else {
                  reject(new Error(`주소를 찾을 수 없습니다: ${address}`))
                }
              })
            }
          })
        })
      }
      
      const originCoords = await getCoordinates(origin)
      const destCoords = await getCoordinates(destination)
      
      // Calculate distance
      const R = 6371
      const dLat = (destCoords.lat - originCoords.lat) * Math.PI / 180
      const dLon = (destCoords.lng - originCoords.lng) * Math.PI / 180
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(originCoords.lat * Math.PI / 180) * Math.cos(destCoords.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const distance = R * c
      
      let roadDistanceMultiplier = 1.4
      let speed = 40
      
      switch (transportMode) {
        case 'walk':
          speed = 4.5
          roadDistanceMultiplier = 1.2
          break
        case 'public':
          speed = 30
          roadDistanceMultiplier = 1.5
          break
        case 'car':
          speed = 35
          roadDistanceMultiplier = 1.4
          break
      }
      
      const roadDistance = distance * roadDistanceMultiplier
      const duration = Math.ceil((roadDistance / speed) * 60)
      
      const autoTitle = `${prevBox.placeName || prevBox.title} → ${nextBox.placeName || nextBox.title}`
      
      setCurrentPlanBox(prev => prev ? {
        ...prev,
        title: prev.title === '이동' ? autoTitle : prev.title,
        routeInfo: {
          origin: origin,
          destination: destination,
          distance: parseFloat(roadDistance.toFixed(1)),
          duration: duration
        },
        durationMinute: duration % 60,
        durationHour: Math.floor(duration / 60),
        transportMode: transportMode
      } : null)
      
    } catch (error) {
      console.error('경로 계산 실패:', error)
    }
  }, [currentPlanBox, placedBoxes])

  // Auto calculate route when modal opens for transportation category
  useEffect(() => {
    if (isOpen && currentPlanBox && isTransportCategory(currentPlanBox.category)) {
      const timer = setTimeout(() => {
        calculateRoute()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, currentPlanBox?.category, currentPlanBox?.id, placedBoxes?.length, calculateRoute])

  const handleSave = () => {
    if (currentPlanBox) {
      onSave(currentPlanBox)
      onClose()
    }
  }

  if (!isOpen || !currentPlanBox) return null

  const isTransportation = isTransportCategory(currentPlanBox.category)
  const categoryOptions = ['관광', '식사', '카페', '쇼핑', '숙소', '액티비티', '이동', '기타']
  const categoryIcons: { [key: string]: string } = {
    '관광': '🏛️',
    '식사': '🍽️',
    '카페': '☕',
    '쇼핑': '🛍️',
    '숙소': '🏨',
    '액티비티': '🎯',
    '이동': '🚗',
    '기타': '📌'
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
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '6px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
          width: '100%',
          maxWidth: '420px',
          maxHeight: '70vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Ultra Compact Header */}
          <div style={{
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <select
              value={currentPlanBox.category}
              onChange={(e) => setCurrentPlanBox({ ...currentPlanBox, category: e.target.value })}
              style={{
                padding: '3px 6px',
                border: '1px solid #e5e7eb',
                borderRadius: '3px',
                backgroundColor: 'white',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>
                  {categoryIcons[cat]} {cat}
                </option>
              ))}
            </select>

            <InlineEdit
              value={currentPlanBox.title}
              onChange={(value) => setCurrentPlanBox({ ...currentPlanBox, title: value })}
              placeholder="제목"
              style={{
                flex: 1,
                fontSize: '13px',
                fontWeight: '600'
              }}
            />

            <button
              onClick={onClose}
              style={{
                width: '20px',
                height: '20px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px'
          }}>
            {!isTransportation ? (
              <>
                {/* Place Section */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px'
                  }}>
                    <InlineEdit
                      value={currentPlanBox.placeName || ''}
                      onChange={(value) => setCurrentPlanBox({ ...currentPlanBox, placeName: value })}
                      placeholder="장소명을 입력하세요"
                      style={{ flex: 1, fontSize: '12px' }}
                    />
                    <button
                      onClick={() => setShowMap(!showMap)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: showMap ? '#3b82f6' : '#f3f4f6',
                        color: showMap ? 'white' : '#374151',
                        borderRadius: '3px',
                        border: `1px solid ${showMap ? '#3b82f6' : '#e5e7eb'}`,
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '500',
                        transition: 'all 0.1s'
                      }}
                    >
                      지도로 찾기
                    </button>
                  </div>

                  {/* Map Search - Only when button clicked */}
                  {showMap && (
                    <div style={{
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px',
                      padding: '8px',
                      marginBottom: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <input
                        type="text"
                        placeholder="장소 검색..."
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        disabled={!kakaoLoaded}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          border: '1px solid #d1d5db',
                          borderRadius: '3px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      
                      {searchResults.length > 0 && (
                        <div style={{
                          marginTop: '4px',
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '3px',
                          maxHeight: '100px',
                          overflowY: 'auto'
                        }}>
                          {searchResults.map((place, index) => (
                            <div
                              key={index}
                              onClick={() => selectPlace(place)}
                              style={{
                                padding: '4px 6px',
                                cursor: 'pointer',
                                borderBottom: index < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                                fontSize: '11px',
                                transition: 'background-color 0.1s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <div style={{ fontWeight: '500' }}>{place.place_name}</div>
                              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '1px' }}>
                                {place.road_address_name || place.address_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Address */}
                  <InlineEdit
                    value={currentPlanBox.address || ''}
                    onChange={(value) => setCurrentPlanBox({ ...currentPlanBox, address: value })}
                    placeholder="주소"
                    style={{ width: '100%', fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}
                  />

                  {/* Time & Duration */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '6px',
                    flexWrap: 'wrap'
                  }}>
                    <InlineEdit
                      value={currentPlanBox.startHour ?? ''}
                      onChange={(value) => setCurrentPlanBox({ 
                        ...currentPlanBox, 
                        startHour: value ? parseInt(value) : null,
                        hasTimeSet: true
                      })}
                      type="number"
                      placeholder="00"
                      style={{ width: '28px', textAlign: 'center', fontSize: '12px' }}
                    />
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>:</span>
                    <InlineEdit
                      value={currentPlanBox.startMinute ?? ''}
                      onChange={(value) => setCurrentPlanBox({ 
                        ...currentPlanBox, 
                        startMinute: value ? parseInt(value) : null,
                        hasTimeSet: true
                      })}
                      type="number"
                      placeholder="00"
                      style={{ width: '28px', textAlign: 'center', fontSize: '12px' }}
                    />
                    <span style={{ color: '#d1d5db', fontSize: '11px', margin: '0 4px' }}>~</span>
                    <span style={{ color: '#6b7280', fontSize: '12px' }}>
                      {calculateEndTime() || '--:--'}
                    </span>
                    <span style={{ color: '#d1d5db', fontSize: '11px', margin: '0 4px' }}>|</span>
                    <InlineEdit
                      value={currentPlanBox.durationHour}
                      onChange={(value) => setCurrentPlanBox({ 
                        ...currentPlanBox, 
                        durationHour: parseInt(value) || 0 
                      })}
                      type="number"
                      placeholder="0"
                      style={{ width: '20px', textAlign: 'center', fontSize: '12px' }}
                    />
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>h</span>
                    <InlineEdit
                      value={currentPlanBox.durationMinute}
                      onChange={(value) => setCurrentPlanBox({ 
                        ...currentPlanBox, 
                        durationMinute: parseInt(value) || 0 
                      })}
                      type="number"
                      placeholder="0"
                      style={{ width: '20px', textAlign: 'center', fontSize: '12px' }}
                    />
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>m</span>
                  </div>

                  {/* Cost */}
                  <InlineEdit
                    value={currentPlanBox.cost}
                    onChange={(value) => setCurrentPlanBox({ ...currentPlanBox, cost: value })}
                    placeholder="비용 (예: 10,000원)"
                    style={{ width: '100%', fontSize: '12px', marginBottom: '6px' }}
                  />
                </div>
              </>
            ) : (
              /* Transportation Mode */
              <>
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '8px'
                }}>
                  {[
                    { mode: 'car', icon: '🚗', label: '자동차' },
                    { mode: 'public', icon: '🚇', label: '대중교통' },
                    { mode: 'walk', icon: '🚶', label: '도보' }
                  ].map(({ mode, icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setCurrentPlanBox({ ...currentPlanBox, transportMode: mode as any })
                        setTimeout(calculateRoute, 100)
                      }}
                      style={{
                        flex: 1,
                        padding: '6px',
                        backgroundColor: currentPlanBox.transportMode === mode ? '#3b82f6' : '#f3f4f6',
                        color: currentPlanBox.transportMode === mode ? 'white' : '#374151',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        transition: 'all 0.1s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px'
                      }}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {currentPlanBox.routeInfo && (
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '4px',
                    padding: '8px',
                    color: 'white',
                    marginBottom: '8px',
                    fontSize: '11px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📍 {currentPlanBox.routeInfo.origin}
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        🏁 {currentPlanBox.routeInfo.destination}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span>📏 {currentPlanBox.routeInfo.distance}km</span>
                      <span>⏱️ {currentPlanBox.routeInfo.duration}분</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={calculateRoute}
                  style={{
                    width: '100%',
                    padding: '6px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    marginBottom: '8px'
                  }}
                >
                  🔄 경로 다시 계산
                </button>

                <InlineEdit
                  value={currentPlanBox.cost}
                  onChange={(value) => setCurrentPlanBox({ ...currentPlanBox, cost: value })}
                  placeholder="예상비용 (예: 5,000원)"
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </>
            )}

            {/* Memo */}
            <div style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '11px',
                color: '#9ca3af',
                marginBottom: '2px'
              }}>메모</div>
              <InlineEdit
                value={currentPlanBox.memo}
                onChange={(value) => setCurrentPlanBox({ ...currentPlanBox, memo: value })}
                placeholder="메모를 입력하세요..."
                multiline={true}
                style={{ 
                  width: '100%',
                  fontSize: '12px',
                  lineHeight: '1.3',
                  minHeight: '30px'
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid #e5e7eb',
            padding: '6px 10px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '4px'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '4px 10px',
                color: '#6b7280',
                backgroundColor: 'white',
                borderRadius: '3px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '4px 10px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
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