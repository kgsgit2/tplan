import { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion'
import { useSpring as useReactSpring, animated } from '@react-spring/web'
import KakaoMapLoader, { isKakaoMapAvailable } from './KakaoMapLoader'
import KakaoPlaceSearch from './KakaoPlaceSearch'

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
    originCoords?: { lat: number; lng: number }
    destinationCoords?: { lat: number; lng: number }
    distance: number
    duration: number
    realRoute?: any
  }
}

interface TransportBoxModalProps {
  isOpen: boolean
  planBox: PlanBox | null
  onClose: () => void
  onSave: (planBox: PlanBox) => void
  placedBoxes?: PlanBox[]
}

// SVG Icons as components for better performance
const Icons = {
  Car: memo(() => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14v-5H5v5zm10-5h2m-6 0h2m-8 0h2"/>
      <path d="M5 17v3h2v-3m12 0v3h-2v-3"/>
      <path d="M7 12l-2-7h14l-2 7"/>
      <path d="M9 7h6"/>
    </svg>
  )),
  Bus: memo(() => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="16" rx="2"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <circle cx="7.5" cy="16" r="1"/>
      <circle cx="16.5" cy="16" r="1"/>
      <path d="M9 6h6"/>
    </svg>
  )),
  Walk: memo(() => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1.5"/>
      <path d="M7 20l3-10 2 3 3-3 2 10"/>
      <path d="M10 13l2-3v5"/>
    </svg>
  )),
  Location: memo(() => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )),
  Destination: memo(() => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )),
  Route: memo(() => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 7 9 3 15 7 21 3"/>
      <polyline points="3 17 9 13 15 17 21 13"/>
    </svg>
  )),
  Map: memo(() => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  )),
  Clock: memo(() => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )),
  Distance: memo(() => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="18" y2="12"/>
      <polyline points="15 9 18 12 15 15"/>
      <line x1="3" y1="6" x2="3" y2="18"/>
      <line x1="21" y1="6" x2="21" y2="18"/>
    </svg>
  )),
  Money: memo(() => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  )),
  Close: memo(() => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )),
  Check: memo(() => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )),
  Save: memo(() => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  )),
  Sparkle: memo(() => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/>
    </svg>
  )),
  Sync: memo(() => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )),
  Error: memo(() => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ))
}

// Transport mode configurations with better color system
const TRANSPORT_MODES = [
  { 
    id: 'car' as const, 
    Icon: Icons.Car,
    label: '자동차',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#93c5fd',
    speed: 40 // km/h
  },
  { 
    id: 'public' as const, 
    Icon: Icons.Bus,
    label: '대중교통',
    color: '#10b981',
    bgColor: '#f0fdf4',
    borderColor: '#86efac',
    speed: 25 // km/h
  },
  { 
    id: 'walk' as const, 
    Icon: Icons.Walk,
    label: '도보',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fcd34d',
    speed: 4 // km/h
  }
]

// Animation variants for better UX
const modalVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' }
  }
}

const contentVariants = {
  hidden: { 
    scale: 0.95, 
    opacity: 0,
    y: 20 
  },
  visible: { 
    scale: 1, 
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.3, 
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: { 
    scale: 0.95, 
    opacity: 0,
    y: 10,
    transition: { 
      duration: 0.2, 
      ease: [0.4, 0, 1, 1]
    }
  }
}

// Optimized TransportBoxModal component
function TransportBoxModal({ 
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
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const polylineRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const modalRef = useRef<HTMLDivElement>(null)

  // Performance optimization with React Spring for smoother animations
  const [progressSpring, progressApi] = useReactSpring(() => ({
    from: { width: '0%' },
    to: { width: '0%' },
    config: { tension: 280, friction: 60 }
  }))

  // Initialize plan box
  useEffect(() => {
    if (planBox) {
      const boxToSet = { ...planBox }
      
      if (!boxToSet.transportMode) {
        boxToSet.transportMode = 'car'
      }
      
      if (boxToSet.dayIndex !== undefined && boxToSet.startHour !== null && !boxToSet.routeInfo) {
        const detectedRoute = detectAdjacentBoxes(boxToSet)
        if (detectedRoute) {
          boxToSet.routeInfo = detectedRoute
          boxToSet.title = `${detectedRoute.origin} → ${detectedRoute.destination}`
          setIsAutoDetected(true)
        }
      }
      
      setCurrentPlanBox(boxToSet)
      setIsEditMode(!boxToSet.dayIndex)
    }
  }, [planBox])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && e.ctrlKey) {
        handleSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus trap for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }

      modalRef.current.addEventListener('keydown', handleTabKey)
      firstElement?.focus()

      return () => {
        modalRef.current?.removeEventListener('keydown', handleTabKey)
      }
    }
  }, [isOpen])

  // Detect adjacent boxes for auto route calculation
  const detectAdjacentBoxes = useCallback((transportBox: PlanBox) => {
    if (transportBox.dayIndex === undefined || transportBox.startHour === null) return null
    
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
      
      return {
        origin,
        destination,
        distance: 0,
        duration: 30
      }
    }
    
    return null
  }, [placedBoxes])

  // Calculate actual route with better error handling
  const calculateRoute = useCallback(async () => {
    if (!currentPlanBox?.routeInfo || !window.kakao?.maps) return
    
    const { originCoords, destinationCoords } = currentPlanBox.routeInfo
    
    if (!originCoords || !destinationCoords) {
      setRouteError('출발지와 도착지를 모두 선택해주세요')
      return
    }
    
    setIsCalculatingRoute(true)
    setRouteError(null)
    
    // Animate progress
    progressApi.start({ width: '70%' })
    
    try {
      // Simulate API delay for UX
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Calculate distance using Haversine formula
      const R = 6371
      const dLat = (destinationCoords.lat - originCoords.lat) * Math.PI / 180
      const dLon = (destinationCoords.lng - originCoords.lng) * Math.PI / 180
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(originCoords.lat * Math.PI / 180) * Math.cos(destinationCoords.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const distance = R * c
      
      // Get speed based on transport mode
      const selectedMode = TRANSPORT_MODES.find(m => m.id === currentPlanBox.transportMode)
      const speed = selectedMode?.speed || 40
      
      const duration = Math.round((distance / speed) * 60)
      
      progressApi.start({ width: '100%' })
      
      setCurrentPlanBox({
        ...currentPlanBox,
        routeInfo: {
          ...currentPlanBox.routeInfo,
          distance: Math.round(distance * 10) / 10,
          duration: duration
        },
        durationHour: Math.floor(duration / 60),
        durationMinute: duration % 60
      })
      
      setTimeout(() => {
        progressApi.start({ width: '0%' })
      }, 500)
      
    } catch (error) {
      console.error('Route calculation error:', error)
      setRouteError('경로 계산 중 오류가 발생했습니다')
      progressApi.start({ width: '0%' })
    } finally {
      setIsCalculatingRoute(false)
    }
  }, [currentPlanBox, progressApi])

  // Handle transport mode change with animation
  const handleTransportModeChange = useCallback((mode: typeof TRANSPORT_MODES[0]['id']) => {
    if (!currentPlanBox) return
    
    const updatedBox = { ...currentPlanBox, transportMode: mode }
    setCurrentPlanBox(updatedBox)
    
    if (updatedBox.routeInfo?.originCoords && updatedBox.routeInfo?.destinationCoords) {
      setTimeout(() => calculateRoute(), 100)
    }
  }, [currentPlanBox, calculateRoute])

  // Handle place selection
  const handleOriginSelect = useCallback((place: any) => {
    if (!currentPlanBox) return
    
    setCurrentPlanBox({
      ...currentPlanBox,
      routeInfo: {
        ...currentPlanBox.routeInfo!,
        origin: place.name,
        originCoords: { lat: place.lat, lng: place.lng }
      }
    })
  }, [currentPlanBox])

  const handleDestinationSelect = useCallback((place: any) => {
    if (!currentPlanBox) return
    
    setCurrentPlanBox({
      ...currentPlanBox,
      routeInfo: {
        ...currentPlanBox.routeInfo!,
        destination: place.name,
        destinationCoords: { lat: place.lat, lng: place.lng }
      }
    })
  }, [currentPlanBox])

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!showMapModal || !mapContainerRef.current || !window.kakao?.maps) return
    
    const container = mapContainerRef.current
    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780),
      level: 5
    }
    
    mapInstanceRef.current = new window.kakao.maps.Map(container, options)
    
    if (currentPlanBox?.routeInfo?.originCoords && currentPlanBox?.routeInfo?.destinationCoords) {
      drawRoute()
    }
  }, [showMapModal, currentPlanBox])

  // Draw route on map with actual directions
  const drawRoute = useCallback(() => {
    if (!mapInstanceRef.current || !currentPlanBox?.routeInfo) return
    
    const { originCoords, destinationCoords } = currentPlanBox.routeInfo
    if (!originCoords || !destinationCoords) return
    
    // Clear previous markers and polylines
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
    if (polylineRef.current) {
      polylineRef.current.setMap(null)
    }
    
    // Create custom markers with labels
    const originContent = '<div style="padding:5px;background:#10b981;color:white;border-radius:4px;font-size:12px;">출발</div>'
    const destContent = '<div style="padding:5px;background:#3b82f6;color:white;border-radius:4px;font-size:12px;">도착</div>'
    
    const originOverlay = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(originCoords.lat, originCoords.lng),
      content: originContent,
      map: mapInstanceRef.current,
      yAnchor: 2
    })
    
    const destOverlay = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(destinationCoords.lat, destinationCoords.lng),
      content: destContent,
      map: mapInstanceRef.current,
      yAnchor: 2
    })
    
    // Add markers
    const originMarker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(originCoords.lat, originCoords.lng),
      map: mapInstanceRef.current,
      image: new window.kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
        new window.kakao.maps.Size(24, 35)
      )
    })
    
    const destMarker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(destinationCoords.lat, destinationCoords.lng),
      map: mapInstanceRef.current
    })
    
    markersRef.current.push(originMarker, destMarker)
    
    // Get transport mode color
    const selectedMode = TRANSPORT_MODES.find(m => m.id === currentPlanBox.transportMode)
    
    // Try to get actual route (simulated for now)
    // In production, you would call Kakao Directions API here
    const waypoints = generateWaypoints(originCoords, destinationCoords)
    const linePath = waypoints.map(point => 
      new window.kakao.maps.LatLng(point.lat, point.lng)
    )
    
    // Draw polyline with animation
    polylineRef.current = new window.kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 6,
      strokeColor: selectedMode?.color || '#3b82f6',
      strokeOpacity: 0.8,
      strokeStyle: currentPlanBox.transportMode === 'walk' ? 'shortdash' : 'solid'
    })
    
    polylineRef.current.setMap(mapInstanceRef.current)
    
    // Add distance/duration info overlay
    const midPoint = waypoints[Math.floor(waypoints.length / 2)]
    const infoContent = `
      <div style="
        padding:8px 12px;
        background:white;
        border:2px solid ${selectedMode?.color || '#3b82f6'};
        border-radius:8px;
        font-size:12px;
        box-shadow:0 2px 8px rgba(0,0,0,0.1);
      ">
        <div style="font-weight:bold;color:${selectedMode?.color || '#3b82f6'}">
          ${selectedMode?.icon || '🚗'} ${currentPlanBox.routeInfo.distance}km
        </div>
        <div style="color:#6b7280;margin-top:2px;">
          약 ${currentPlanBox.routeInfo.duration}분
        </div>
      </div>
    `
    
    const infoOverlay = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(midPoint.lat, midPoint.lng),
      content: infoContent,
      map: mapInstanceRef.current,
      yAnchor: 0.5
    })
    
    // Fit bounds
    const bounds = new window.kakao.maps.LatLngBounds()
    linePath.forEach(point => bounds.extend(point))
    mapInstanceRef.current.setBounds(bounds)
  }, [currentPlanBox])
  
  // Generate waypoints for curved route (simulated)
  const generateWaypoints = (start: {lat: number, lng: number}, end: {lat: number, lng: number}) => {
    const points = []
    const steps = 10
    
    // Add some curve to the route for visual appeal
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const curve = Math.sin(t * Math.PI) * 0.002 // Small curve factor
      
      points.push({
        lat: start.lat + (end.lat - start.lat) * t + curve,
        lng: start.lng + (end.lng - start.lng) * t
      })
    }
    
    return points
  }

  useEffect(() => {
    if (showMapModal) {
      setTimeout(initializeMap, 100)
    }
  }, [showMapModal, initializeMap])

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
  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) {
      return `${minutes}분`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`
  }, [])

  // Format cost based on transport mode
  const formatCost = useCallback(() => {
    if (!currentPlanBox) return '무료'
    
    if (currentPlanBox.cost) return currentPlanBox.cost
    
    switch (currentPlanBox.transportMode) {
      case 'walk':
        return '무료'
      case 'public':
        return '₩1,400'
      case 'car':
        const distance = currentPlanBox.routeInfo?.distance || 0
        const fuelCost = Math.round(distance * 150)
        return fuelCost > 0 ? `₩${fuelCost.toLocaleString()}` : '계산 중'
      default:
        return '무료'
    }
  }, [currentPlanBox])

  // Save with loading state
  const handleSave = useCallback(async () => {
    if (!currentPlanBox) return
    
    setIsSaving(true)
    
    // Simulate save delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (currentPlanBox.routeInfo && !currentPlanBox.title.includes('→')) {
      currentPlanBox.title = `${currentPlanBox.routeInfo.origin} → ${currentPlanBox.routeInfo.destination}`
    }
    
    onSave(currentPlanBox)
    setIsSaving(false)
    onClose()
  }, [currentPlanBox, onSave, onClose])

  const handleKakaoMapLoad = useCallback(() => {
    setKakaoLoaded(true)
  }, [])

  const handleKakaoMapError = useCallback((error: string) => {
    setKakaoLoaded(false)
    console.error('[TransportBoxModal] 카카오 맵 로드 실패:', error)
  }, [])

  // Memoized selected mode
  const selectedMode = useMemo(() => 
    TRANSPORT_MODES.find(m => m.id === currentPlanBox?.transportMode) || TRANSPORT_MODES[0],
    [currentPlanBox?.transportMode]
  )

  if (!isOpen || !currentPlanBox) return null

  return (
    <>
      <KakaoMapLoader onLoad={handleKakaoMapLoad} onError={handleKakaoMapError} />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
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
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
            onClick={onClose}
          >
            <motion.div
              ref={modalRef}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                width: '90%',
                maxWidth: '520px',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              {/* Progress bar */}
              <animated.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                  borderRadius: '3px',
                  zIndex: 100,
                  ...progressSpring
                }}
              />

              {/* Header */}
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb',
                background: 'linear-gradient(135deg, #ffffff, #fafafa)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      backgroundColor: selectedMode.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${selectedMode.borderColor}`,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <selectedMode.Icon />
                  </motion.div>
                  <div style={{ flex: 1 }}>
                    <h2 
                      id="modal-title"
                      style={{ 
                        fontSize: '20px', 
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '4px'
                      }}
                    >
                      이동 경로 설정
                    </h2>
                    <AnimatePresence>
                      {isAutoDetected && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          style={{
                            fontSize: '13px',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Icons.Sparkle />
                          인접 장소 자동 감지됨
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '10px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-label="닫기"
                  >
                    <Icons.Close />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                background: 'linear-gradient(180deg, #fafafa, #f9fafb)'
              }}>
                {/* Transport Mode Selector */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '12px'
                  }}>
                    이동 수단
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px'
                  }}>
                    {TRANSPORT_MODES.map((mode) => {
                      const isSelected = currentPlanBox.transportMode === mode.id
                      return (
                        <motion.button
                          key={mode.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleTransportModeChange(mode.id)}
                          style={{
                            padding: '16px 12px',
                            borderRadius: '12px',
                            border: isSelected 
                              ? `2px solid ${mode.color}` 
                              : '2px solid #e5e7eb',
                            backgroundColor: isSelected 
                              ? mode.bgColor 
                              : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px',
                            position: 'relative',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: isSelected 
                              ? `0 4px 12px ${mode.color}20`
                              : '0 1px 3px rgba(0, 0, 0, 0.05)'
                          }}
                          aria-pressed={isSelected}
                          aria-label={`${mode.label} 선택`}
                        >
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  color: mode.color
                                }}
                              >
                                <Icons.Check />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div style={{ color: isSelected ? mode.color : '#6b7280' }}>
                            <mode.Icon />
                          </div>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: isSelected ? '600' : '500',
                            color: isSelected ? mode.color : '#374151'
                          }}>
                            {mode.label}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Route Information Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {/* Origin */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '10px'
                    }}>
                      <div style={{ color: '#10b981' }}>
                        <Icons.Location />
                      </div>
                      출발지
                    </label>
                    {isEditMode || !currentPlanBox.routeInfo?.origin ? (
                      <KakaoPlaceSearch
                        onSelectPlace={handleOriginSelect}
                        placeholder="출발지를 검색하세요"
                        defaultValue={currentPlanBox.routeInfo?.origin || ''}
                        compact
                      />
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        style={{
                          padding: '12px 14px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '10px',
                          fontSize: '14px',
                          color: '#111827',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontWeight: '500' }}>{currentPlanBox.routeInfo.origin}</span>
                        {currentPlanBox.startHour !== null && (
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }}>
                            {String(currentPlanBox.startHour).padStart(2, '0')}:
                            {String(currentPlanBox.startMinute || 0).padStart(2, '0')}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Destination */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '10px'
                    }}>
                      <div style={{ color: '#3b82f6' }}>
                        <Icons.Destination />
                      </div>
                      도착지
                    </label>
                    {isEditMode || !currentPlanBox.routeInfo?.destination ? (
                      <KakaoPlaceSearch
                        onSelectPlace={handleDestinationSelect}
                        placeholder="도착지를 검색하세요"
                        defaultValue={currentPlanBox.routeInfo?.destination || ''}
                        compact
                      />
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        style={{
                          padding: '12px 14px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '10px',
                          fontSize: '14px',
                          color: '#111827',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontWeight: '500' }}>{currentPlanBox.routeInfo.destination}</span>
                        {calculateEndTime() && (
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }}>
                            {calculateEndTime()}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Calculate Route Button */}
                  <AnimatePresence>
                    {currentPlanBox.routeInfo?.originCoords && currentPlanBox.routeInfo?.destinationCoords && (
                      <motion.button
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={calculateRoute}
                        disabled={isCalculatingRoute}
                        style={{
                          width: '100%',
                          marginTop: '20px',
                          padding: '12px',
                          backgroundColor: selectedMode.color,
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: isCalculatingRoute ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          opacity: isCalculatingRoute ? 0.7 : 1,
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: `0 4px 12px ${selectedMode.color}30`
                        }}
                      >
                        {isCalculatingRoute ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <Icons.Sync />
                            </motion.div>
                            경로 계산 중...
                          </>
                        ) : (
                          <>
                            <Icons.Route />
                            경로 계산하기
                          </>
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* Error message */}
                  <AnimatePresence>
                    {routeError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                          marginTop: '12px',
                          padding: '12px',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          color: '#dc2626',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Icons.Error />
                        {routeError}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Route Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    marginBottom: '20px'
                  }}
                >
                  {[
                    { icon: Icons.Distance, label: '거리', value: currentPlanBox.routeInfo?.distance ? `${currentPlanBox.routeInfo.distance}km` : '-' },
                    { icon: Icons.Clock, label: '소요시간', value: currentPlanBox.routeInfo?.duration ? formatDuration(currentPlanBox.routeInfo.duration) : '-' },
                    { icon: Icons.Money, label: '예상비용', value: formatCost() }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        color: '#6b7280',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'center'
                      }}>
                        <stat.icon />
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '6px',
                        fontWeight: '500'
                      }}>
                        {stat.label}
                      </div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#111827'
                      }}>
                        {stat.value}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Map Preview Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={currentPlanBox.routeInfo?.originCoords && currentPlanBox.routeInfo?.destinationCoords ? { scale: 1.02 } : {}}
                  whileTap={currentPlanBox.routeInfo?.originCoords && currentPlanBox.routeInfo?.destinationCoords ? { scale: 0.98 } : {}}
                  onClick={() => {
                    console.log('Map button clicked', currentPlanBox.routeInfo)
                    if (currentPlanBox.routeInfo?.originCoords && currentPlanBox.routeInfo?.destinationCoords) {
                      setShowMapModal(true)
                    } else {
                      setRouteError('출발지와 도착지를 먼저 설정해주세요')
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    color: currentPlanBox.routeInfo?.originCoords && currentPlanBox.routeInfo?.destinationCoords 
                      ? '#374151' 
                      : '#9ca3af',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: currentPlanBox.routeInfo?.originCoords && currentPlanBox.routeInfo?.destinationCoords 
                      ? 'pointer' 
                      : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    marginBottom: '20px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPlanBox.routeInfo?.originCoords && currentPlanBox.routeInfo?.destinationCoords) {
                      e.currentTarget.style.borderColor = selectedMode.color
                      e.currentTarget.style.backgroundColor = selectedMode.bgColor
                      e.currentTarget.style.color = selectedMode.color
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.color = '#374151'
                  }}
                >
                  <Icons.Map />
                  지도에서 경로 확인
                </motion.button>

                {/* Memo Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '10px'
                  }}>
                    메모
                  </label>
                  <textarea
                    value={currentPlanBox.memo}
                    onChange={(e) => setCurrentPlanBox({ ...currentPlanBox, memo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '80px',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s',
                      backgroundColor: '#fafafa'
                    }}
                    placeholder="교통편 예약 정보, 주의사항 등을 입력하세요"
                    onFocus={(e) => {
                      e.target.style.borderColor = selectedMode.color
                      e.target.style.backgroundColor = '#ffffff'
                      e.target.style.boxShadow = `0 0 0 3px ${selectedMode.color}15`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb'
                      e.target.style.backgroundColor = '#fafafa'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </motion.div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '20px 24px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                backgroundColor: 'white'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#9ca3af'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                  }}
                >
                  취소
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: selectedMode.color,
                    color: 'white',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSaving ? 0.7 : 1,
                    boxShadow: `0 4px 12px ${selectedMode.color}30`
                  }}
                >
                  {isSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Icons.Sync />
                    </motion.div>
                  ) : (
                    <Icons.Save />
                  )}
                  {isSaving ? '저장 중...' : '저장'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Modal */}
      <AnimatePresence>
        {showMapModal && (
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
            onClick={() => setShowMapModal(false)}
          >
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                width: '90%',
                maxWidth: '900px',
                height: '80vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              {/* Map Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #ffffff, #fafafa)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ color: selectedMode.color }}>
                    <Icons.Map />
                  </div>
                  <div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#111827'
                    }}>
                      경로 지도
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginTop: '2px'
                    }}>
                      {currentPlanBox.routeInfo?.origin} → {currentPlanBox.routeInfo?.destination}
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowMapModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '10px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  aria-label="닫기"
                >
                  <Icons.Close />
                </motion.button>
              </div>

              {/* Map Container */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div 
                  ref={mapContainerRef}
                  style={{
                    width: '100%',
                    height: '100%'
                  }}
                />
                
                {/* Route Info Overlay */}
                <AnimatePresence>
                  {currentPlanBox.routeInfo?.distance && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '20px',
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                        minWidth: '280px',
                        backdropFilter: 'blur(10px)',
                        background: 'rgba(255, 255, 255, 0.95)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ color: selectedMode.color }}>
                          <selectedMode.Icon />
                        </div>
                        <span style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: '#111827'
                        }}>
                          {selectedMode.label}로 이동
                        </span>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px'
                      }}>
                        <div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#6b7280', 
                            marginBottom: '6px',
                            fontWeight: '500'
                          }}>
                            거리
                          </div>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            color: '#111827' 
                          }}>
                            {currentPlanBox.routeInfo.distance}km
                          </div>
                        </div>
                        <div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#6b7280', 
                            marginBottom: '6px',
                            fontWeight: '500'
                          }}>
                            소요시간
                          </div>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            color: '#111827' 
                          }}>
                            {formatDuration(currentPlanBox.routeInfo.duration)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default memo(TransportBoxModal)