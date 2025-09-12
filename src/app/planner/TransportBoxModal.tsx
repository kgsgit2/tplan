import { useState, useEffect, useCallback } from 'react'
import KakaoMapLoader, { isKakaoMapAvailable } from './KakaoMapLoader'

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

interface TransportBoxModalProps {
  isOpen: boolean
  planBox: PlanBox | null
  onClose: () => void
  onSave: (planBox: PlanBox) => void
  placedBoxes?: PlanBox[]
}

// Transport mode configurations
const TRANSPORT_MODES = [
  { 
    id: 'car' as const, 
    icon: 'directions_car', 
    label: '자동차',
    estimatedSpeed: 40 // km/h
  },
  { 
    id: 'public' as const, 
    icon: 'directions_transit', 
    label: '대중교통',
    estimatedSpeed: 25 // km/h
  },
  { 
    id: 'walk' as const, 
    icon: 'directions_walk', 
    label: '도보',
    estimatedSpeed: 4 // km/h
  }
]

export default function TransportBoxModal({ 
  isOpen, 
  planBox, 
  onClose, 
  onSave, 
  placedBoxes = [] 
}: TransportBoxModalProps) {
  const [currentPlanBox, setCurrentPlanBox] = useState<PlanBox | null>(null)
  const [showMapModal, setShowMapModal] = useState(false)
  const [kakaoLoaded, setKakaoLoaded] = useState(false)
  const [isAutoDetected, setIsAutoDetected] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    if (planBox) {
      const boxToSet = { ...planBox }
      
      // Set default transport mode if not set
      if (!boxToSet.transportMode) {
        boxToSet.transportMode = 'car'
      }
      
      // Auto-detect adjacent boxes if placed on timeline
      if (boxToSet.dayIndex !== undefined && boxToSet.startHour !== null && !boxToSet.routeInfo) {
        const detectedRoute = detectAdjacentBoxes(boxToSet)
        if (detectedRoute) {
          boxToSet.routeInfo = detectedRoute
          boxToSet.title = `${detectedRoute.origin} → ${detectedRoute.destination}`
          setIsAutoDetected(true)
        }
      }
      
      setCurrentPlanBox(boxToSet)
      
      // Determine if edit mode should be enabled
      setIsEditMode(!boxToSet.dayIndex) // Enable edit only if not placed on timeline
    }
  }, [planBox])

  // Detect adjacent boxes for auto route calculation
  const detectAdjacentBoxes = useCallback((transportBox: PlanBox) => {
    if (!transportBox.dayIndex === undefined || !transportBox.startHour) return null
    
    const sameDayBoxes = placedBoxes
      .filter(box => 
        box.dayIndex === transportBox.dayIndex && 
        box.id !== transportBox.id &&
        box.category !== 'transport'
      )
      .sort((a, b) => {
        if (a.startHour === null || b.startHour === null) return 0
        return (a.startHour * 60 + (a.startMinute || 0)) - (b.startHour * 60 + (b.startMinute || 0))
      })
    
    const transportTime = transportBox.startHour * 60 + (transportBox.startMinute || 0)
    
    let prevBox: PlanBox | null = null
    let nextBox: PlanBox | null = null
    
    for (const box of sameDayBoxes) {
      if (!box.startHour) continue
      const boxTime = box.startHour * 60 + (box.startMinute || 0)
      
      if (boxTime <= transportTime) {
        prevBox = box
      } else if (!nextBox) {
        nextBox = box
        break
      }
    }
    
    if (prevBox && nextBox) {
      const origin = prevBox.placeName || prevBox.location || prevBox.title
      const destination = nextBox.placeName || nextBox.location || nextBox.title
      
      // Calculate estimated time based on transport mode
      const mode = TRANSPORT_MODES.find(m => m.id === transportBox.transportMode) || TRANSPORT_MODES[0]
      const estimatedDistance = Math.random() * 15 + 5 // Mock distance 5-20km
      const estimatedDuration = Math.round((estimatedDistance / mode.estimatedSpeed) * 60)
      
      return {
        origin,
        destination,
        distance: estimatedDistance,
        duration: estimatedDuration
      }
    }
    
    return null
  }, [placedBoxes])

  // Handle transport mode change
  const handleTransportModeChange = (mode: typeof TRANSPORT_MODES[0]['id']) => {
    if (!currentPlanBox) return
    
    const updatedBox = { ...currentPlanBox, transportMode: mode }
    
    // Recalculate duration if route exists
    if (updatedBox.routeInfo) {
      const modeConfig = TRANSPORT_MODES.find(m => m.id === mode) || TRANSPORT_MODES[0]
      const newDuration = Math.round((updatedBox.routeInfo.distance / modeConfig.estimatedSpeed) * 60)
      
      updatedBox.routeInfo = {
        ...updatedBox.routeInfo,
        duration: newDuration
      }
      
      updatedBox.durationHour = Math.floor(newDuration / 60)
      updatedBox.durationMinute = newDuration % 60
    }
    
    setCurrentPlanBox(updatedBox)
  }

  // Calculate end time
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

  // Format duration display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}분`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`
  }

  const handleSave = () => {
    if (currentPlanBox) {
      onSave(currentPlanBox)
      onClose()
    }
  }

  const handleKakaoMapLoad = useCallback(() => {
    setKakaoLoaded(true)
  }, [])

  const handleKakaoMapError = useCallback((error: string) => {
    setKakaoLoaded(false)
    console.error('[TransportBoxModal] 카카오 맵 로드 실패:', error)
  }, [])

  if (!isOpen || !currentPlanBox) return null

  return (
    <>
      <KakaoMapLoader onLoad={handleKakaoMapLoad} onError={handleKakaoMapError} />
      
      {/* Main Modal */}
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '90%',
          maxWidth: '520px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Compact Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'linear-gradient(to bottom, #ffffff, #fafafa)'
          }}>
            <span className="material-icons" style={{ 
              color: '#3b82f6',
              fontSize: '24px'
            }}>
              route
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: '#1a1a1a'
              }}>
                이동 경로
              </div>
              {isAutoDetected && (
                <div style={{
                  fontSize: '11px',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '2px'
                }}>
                  <span className="material-icons" style={{ fontSize: '12px' }}>check_circle</span>
                  자동 감지됨
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Content View Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            background: '#fafafa'
          }}>
            {/* Route Display Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              {/* Origin & Destination */}
              <div style={{ position: 'relative' }}>
                {/* Origin */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    출발
                  </div>
                  <div style={{ flex: 1 }}>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={currentPlanBox.routeInfo?.origin || ''}
                        onChange={(e) => setCurrentPlanBox({
                          ...currentPlanBox,
                          routeInfo: {
                            ...currentPlanBox.routeInfo!,
                            origin: e.target.value
                          }
                        })}
                        placeholder="출발지를 입력하세요"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1a1a1a'
                      }}>
                        {currentPlanBox.routeInfo?.origin || '출발지 미정'}
                      </div>
                    )}
                    {currentPlanBox.startHour !== null && (
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '2px'
                      }}>
                        {String(currentPlanBox.startHour).padStart(2, '0')}:
                        {String(currentPlanBox.startMinute || 0).padStart(2, '0')} 출발
                      </div>
                    )}
                  </div>
                </div>

                {/* Route Line with Duration */}
                <div style={{
                  position: 'relative',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: '31px',
                    top: '0',
                    bottom: '0',
                    width: '2px',
                    background: 'linear-gradient(180deg, #10b981 0%, #3b82f6 100%)'
                  }} />
                  
                  {/* Transport Mode Selector */}
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    backgroundColor: 'white',
                    padding: '4px',
                    borderRadius: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    zIndex: 1
                  }}>
                    {TRANSPORT_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => handleTransportModeChange(mode.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '16px',
                          border: 'none',
                          backgroundColor: currentPlanBox.transportMode === mode.id ? '#3b82f6' : 'transparent',
                          color: currentPlanBox.transportMode === mode.id ? 'white' : '#6b7280',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (currentPlanBox.transportMode !== mode.id) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentPlanBox.transportMode !== mode.id) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '16px' }}>
                          {mode.icon}
                        </span>
                        <span>{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Destination */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    도착
                  </div>
                  <div style={{ flex: 1 }}>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={currentPlanBox.routeInfo?.destination || ''}
                        onChange={(e) => setCurrentPlanBox({
                          ...currentPlanBox,
                          routeInfo: {
                            ...currentPlanBox.routeInfo!,
                            destination: e.target.value
                          }
                        })}
                        placeholder="도착지를 입력하세요"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1a1a1a'
                      }}>
                        {currentPlanBox.routeInfo?.destination || '도착지 미정'}
                      </div>
                    )}
                    {calculateEndTime() && (
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '2px'
                      }}>
                        {calculateEndTime()} 도착 예정
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Route Information Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px',
              marginBottom: '16px'
            }}>
              {/* Distance */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  예상 거리
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1a1a1a'
                }}>
                  {currentPlanBox.routeInfo?.distance 
                    ? `${currentPlanBox.routeInfo.distance.toFixed(1)}km`
                    : '-'
                  }
                </div>
              </div>

              {/* Duration */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  소요 시간
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1a1a1a'
                }}>
                  {currentPlanBox.routeInfo?.duration 
                    ? formatDuration(currentPlanBox.routeInfo.duration)
                    : '-'
                  }
                </div>
              </div>

              {/* Cost */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  예상 비용
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1a1a1a'
                }}>
                  {currentPlanBox.cost || '무료'}
                </div>
              </div>
            </div>

            {/* Map Button */}
            <button
              onClick={() => setShowMapModal(true)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#374151',
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
                e.currentTarget.style.backgroundColor = '#f9fafb'
                e.currentTarget.style.borderColor = '#3b82f6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>map</span>
              지도에서 경로 보기
            </button>

            {/* Memo Section */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: '#6b7280',
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
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '60px',
                  fontFamily: 'inherit'
                }}
                placeholder="교통편 예약 정보, 주의사항 등"
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            backgroundColor: 'white'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#6b7280',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {/* Map Modal (Separate) */}
      {showMapModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '800px',
            height: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Map Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1a1a1a'
              }}>
                경로 지도
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* Map Container */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div 
                id="transportRouteMap" 
                style={{
                  width: '100%',
                  height: '100%'
                }}
              />
              
              {/* Route Info Overlay */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                minWidth: '200px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '8px'
                }}>
                  {currentPlanBox.routeInfo?.origin} → {currentPlanBox.routeInfo?.destination}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  fontSize: '14px'
                }}>
                  <div>
                    <span style={{ color: '#6b7280' }}>거리: </span>
                    <span style={{ fontWeight: '600' }}>
                      {currentPlanBox.routeInfo?.distance.toFixed(1)}km
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>시간: </span>
                    <span style={{ fontWeight: '600' }}>
                      {formatDuration(currentPlanBox.routeInfo?.duration || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Icons */}
      <link 
        href="https://fonts.googleapis.com/icon?family=Material+Icons" 
        rel="stylesheet" 
      />
    </>
  )
}