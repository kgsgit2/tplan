'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// 카카오 맵 API 타입 정의
declare global {
  interface Window {
    kakao: any;
  }
}

// 프로토타입과 완전 동일한 타입 정의
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
  hasTimeSet: boolean
  dayIndex?: number
  top?: number
  height?: number
}

interface TimeRange {
  start: number
  end: number
}

export default function PlannerPage() {
  const [tripTitle, setTripTitle] = useState('도쿄 여행')
  const [startDate, setStartDate] = useState('2025-01-15')
  const [endDate, setEndDate] = useState('2025-01-21')
  const [totalDays, setTotalDays] = useState(7)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [modalTitleEditing, setModalTitleEditing] = useState(false)
  const [currentPlanBox, setCurrentPlanBox] = useState<PlanBox | null>(null)
  const [planboxData, setPlanboxData] = useState<PlanBox[]>([])
  const [placedBoxes, setPlacedBoxes] = useState<PlanBox[]>([])
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string>('')

  // 프로토타입 정확한 기본 시간대 설정
  const DEFAULT_TIME_RANGE = { start: 7, end: 24 } // 23시까지 표시하려면 end를 24로 설정
  const [timeRangeStart] = useState(DEFAULT_TIME_RANGE.start)  
  const [timeRangeEnd] = useState(DEFAULT_TIME_RANGE.end)
  const [dayTimeRanges, setDayTimeRanges] = useState<{[key: number]: TimeRange}>({})
  
  // 드래그앤드롭 상태
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null)
  const [draggedData, setDraggedData] = useState<PlanBox | null>(null)
  const [isFirstDrop, setIsFirstDrop] = useState(true)
  const [originalTimeDisplay, setOriginalTimeDisplay] = useState<string | null>(null)
  const [isDraggingFromTimeline, setIsDraggingFromTimeline] = useState(false)
  const [dragGhost, setDragGhost] = useState<{dayIndex: number, hour: number, minute: number, height: number, category: string, title: string} | null>(null)

  // 리사이징 상태
  const [resizingBox, setResizingBox] = useState<PlanBox | null>(null)
  const [resizeStartY, setResizeStartY] = useState<number>(0)
  const [resizeOriginalHeight, setResizeOriginalHeight] = useState<number>(0)
  const [resizeDirection, setResizeDirection] = useState<'top' | 'bottom' | null>(null)
  const [resizeOriginalTop, setResizeOriginalTop] = useState<number>(0)
  
  // 시간배지 상태
  const [timeBadge, setTimeBadge] = useState<{x: number, y: number, text: string} | null>(null)
  
  // 무한 복제 모드 상태
  const [cloneSourceId, setCloneSourceId] = useState<number | null>(null)
  const [isCloneMode, setIsCloneMode] = useState(false)

  // 충돌 알림 상태
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)

  // 뷰 모드 상태
  const [viewMode, setViewMode] = useState<'edit' | 'compress' | 'print'>('edit')
  
  // 시간 설정 모달 상태
  const [isTimeSettingModalOpen, setIsTimeSettingModalOpen] = useState(false)
  const [currentSettingDay, setCurrentSettingDay] = useState<number>(0)
  
  // 플랜박스 탭 상태 (필터/공유)
  const [planBoxTab, setPlanBoxTab] = useState<'filter' | 'share'>('filter')
  
  // 장소 검색 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState('KRW')
  const [exchangeRate, setExchangeRate] = useState(1)

  // 점유된 슬롯 표시
  const [occupiedSlots, setOccupiedSlots] = useState<{[key: string]: boolean}>({})

  // Refs
  const modalTitleEditRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 날짜별 시간 범위 초기화
  useEffect(() => {
    const initialRanges: {[key: number]: TimeRange} = {}
    for (let i = 0; i < totalDays; i++) {
      initialRanges[i] = { ...DEFAULT_TIME_RANGE }
    }
    setDayTimeRanges(initialRanges)
  }, [totalDays])

  // 카카오 맵 API 로드
  useEffect(() => {
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=d0d67d94afae47e0ab9c29b0e6aea5cf&libraries=services&autoload=false`
    script.async = true
    document.head.appendChild(script)
    
    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          console.log('카카오 맵 API 로드 완료')
        })
      }
    }
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // 디버깅용 - placedBoxes 상태 모니터링
  useEffect(() => {
    console.log('📦 PlacedBoxes updated:', placedBoxes)
    updateOccupiedSlots()
  }, [placedBoxes])
  
  // 디버깅용 - draggedData 상태 모니터링
  useEffect(() => {
    console.log('🎯 DraggedData state changed:', draggedData)
  }, [draggedData])

  // 점유된 슬롯 업데이트
  const updateOccupiedSlots = () => {
    const newOccupied: {[key: string]: boolean} = {}
    placedBoxes.forEach(box => {
      if (box.dayIndex !== undefined && box.startHour !== null) {
        const startMinutes = box.startHour * 60 + (box.startMinute || 0)
        const endMinutes = startMinutes + (box.height || 60)
        
        for (let min = startMinutes; min < endMinutes; min += 10) {
          const key = `${box.dayIndex}-${Math.floor(min / 60)}-${min % 60}`
          newOccupied[key] = true
        }
      }
    })
    setOccupiedSlots(newOccupied)
  }

  // 자동저장 - 106번 줄의 useEffect 제거 (602번 줄에 통합된 자동저장 로직 있음)

  // 컴포넌트 마운트 시 localStorage에서 데이터 불러오기
  useEffect(() => {
    console.log('🔄 Loading data from localStorage on mount')
    loadFromStorage()
  }, [])

  // 투명한 드래그 이미지 생성
  const createTransparentDragImage = (e: React.DragEvent) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, 1, 1)
    }
    e.dataTransfer.setDragImage(canvas, 0, 0)
  }

  // 드래그앤드롭 이벤트 핸들러들
  const handleDragStart = (e: React.DragEvent, planBox: PlanBox, isFromTimeline: boolean = false) => {
    console.log('🚀 Drag started:', planBox.title, planBox.id, isFromTimeline ? 'from timeline' : 'from sidebar')
    console.log('📊 PlanBox data:', planBox)
    console.log('🎯 Event:', e)
    
    // 브라우저 호환성 체크
    if (!e.dataTransfer) {
      console.error('❌ dataTransfer not available!')
      return
    }
    
    setDraggedData(planBox)
    setIsDraggingFromTimeline(isFromTimeline)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', planBox.id.toString())
    
    // 투명한 드래그 이미지 설정
    try {
      createTransparentDragImage(e)
    } catch (err) {
      console.error('❌ Error creating transparent image:', err)
    }
    
    // 드래그 중인 요소 스타일링
    const element = e.currentTarget as HTMLElement
    setDraggedElement(element)
    
    if (isFromTimeline) {
      // 타임라인에서 드래그할 때 - 원본 박스를 숨김
      element.classList.add('dragging')
      // 드래그 시작 직후 원본 박스를 숨김 (visibility 사용)
      requestAnimationFrame(() => {
        element.style.visibility = 'hidden'
      })
    } else {
      // 사이드바에서 드래그할 때
      element.classList.add('dragging')
      element.style.opacity = '0.5'
      element.style.transform = 'scale(0.95)'
    }
    
    console.log('✅ DragStart complete, setting draggedData to:', planBox)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('✅ Drag ended')
    const element = e.currentTarget as HTMLElement
    // 스타일 복원 - 빈 문자열로 초기화하여 CSS 스타일이 적용되도록
    element.classList.remove('dragging')
    element.style.opacity = ''
    element.style.pointerEvents = ''  // pointer-events 복원 중요!
    element.style.visibility = ''  // visibility 복원
    element.style.transform = ''
    element.style.zIndex = ''
    
    // 모든 드래그 관련 상태 초기화
    setDraggedElement(null)
    setDraggedData(null)
    setTimeBadge(null)
    setDragGhost(null)  // 드래그 고스트 제거
    setIsDraggingFromTimeline(false)
  }

  const handleSlotDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    console.log('🎯 Drag over slot, draggedData:', draggedData)
    
    const slot = e.currentTarget as HTMLElement
    
    // 드래그 중인 위치 계산 및 시간배지 표시
    if (draggedData) {
      const dayIndex = parseInt(slot.dataset.day || '0')
      const hour = parseInt(slot.dataset.hour || '0')
      const rect = slot.getBoundingClientRect()
      const y = e.clientY - rect.top
      const slotHeight = rect.height // 60px
      
      // 10분 단위로 정확한 스냅 계산
      const minutePerPixel = 60 / slotHeight  // 1픽셀당 분
      const calculatedMinute = y * minutePerPixel  // 계산된 분
      let minute = Math.round(calculatedMinute / 10) * 10  // 10분 단위로 반올림
      
      // 분이 60 이상이면 조정
      if (minute >= 60) {
        minute = 50 // 최대 50분
      }
      if (minute < 0) {
        minute = 0
      }
      
      // 시간배지 위치와 텍스트 설정
      const startTimeText = formatTime(hour, minute)
      const totalMinutes = (hour * 60 + minute) + (draggedData.durationHour * 60 + draggedData.durationMinute)
      const endHour = Math.floor(totalMinutes / 60)
      const endMinute = totalMinutes % 60
      const endTimeText = formatTime(endHour, endMinute)
      
      setTimeBadge({
        x: e.clientX + 20,
        y: e.clientY - 30,
        text: `${startTimeText} ~ ${endTimeText}`
      })
      
      // 드래그 고스트 표시 (원본과 동일한 방식)
      const duration = draggedData.durationHour * 60 + draggedData.durationMinute
      
      setDragGhost({
        dayIndex,
        hour,
        minute: minute,
        height: Math.min(duration, 480), // 최대 8시간(480분)으로 제한
        category: draggedData.category,
        title: draggedData.title
      })
    }
  }

  const handleSlotDragLeave = (e: React.DragEvent) => {
    const slot = e.currentTarget as HTMLElement
    slot.classList.remove('drag-over')
  }

  // 사이드바로 드래그 되돌리기
  const handleSidebarDragOver = (e: React.DragEvent) => {
    if (isDraggingFromTimeline) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleSidebarDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    if (isDraggingFromTimeline && draggedData) {
      // 타임라인에서 사이드바로 되돌리기
      setPlacedBoxes(prev => prev.filter(box => box.id !== draggedData.id))
      
      // 사이드바에 다시 추가 (이미 있으면 추가하지 않음)
      if (!planboxData.find(box => box.id === draggedData.id)) {
        const resetBox = {
          ...draggedData,
          startHour: null,
          startMinute: null,
          hasTimeSet: false,
          dayIndex: undefined,
          top: undefined,
          height: undefined
        }
        setPlanboxData(prev => [...prev, resetBox])
      }
      
      console.log('📥 Returned to sidebar:', draggedData.title)
    }
  }

  const handleSlotDrop = (e: React.DragEvent) => {
    console.log('📍 Drop event triggered')
    e.preventDefault()
    e.stopPropagation()  // 이벤트 버블링 방지
    
    const slot = e.currentTarget as HTMLElement
    slot.classList.remove('drag-over')
    
    // 시간배지와 드래그 고스트 제거
    setTimeBadge(null)
    setDragGhost(null)  // 드래그 고스트 제거
    
    if (!draggedData) {
      console.log('❌ No dragged data found')
      return
    }
    
    const dayIndex = parseInt(slot.dataset.day || '0')
    const hour = parseInt(slot.dataset.hour || '0')
    console.log('📊 Drop target:', { dayIndex, hour, isDraggingFromTimeline })
    
    // 드롭 위치 계산 (10분 단위로 정확히 스냅)
    const rect = slot.getBoundingClientRect()
    const y = e.clientY - rect.top
    const slotHeight = rect.height // 60px
    const minuteOffset = Math.floor((y / slotHeight) * 60)
    let minute = Math.round(minuteOffset / 10) * 10 // 10분 단위로 반올림 스냅
    
    // 분이 60을 넘어가면 다음 시간으로 조정
    let adjustedHour = hour
    if (minute >= 60) {
      adjustedHour = hour + 1
      minute = 0
    }
    // 분이 음수면 이전 시간으로 조정
    if (minute < 0) {
      adjustedHour = hour - 1
      minute = 50
    }
    
    console.log(`📍 Dropped at Day ${dayIndex + 1}, ${adjustedHour}:${minute.toString().padStart(2, '0')}`)
    
    // 플랜박스를 타임라인에 배치
    const durationInMinutes = draggedData.durationHour * 60 + draggedData.durationMinute
    const snappedDuration = Math.round(durationInMinutes / 10) * 10
    
    let placedBox: PlanBox = {
      ...draggedData,
      startHour: adjustedHour,
      startMinute: minute,
      hasTimeSet: true,
      dayIndex: dayIndex,
      top: minute,
      height: snappedDuration
    }
    
    // 무한 복제 모드인 경우 새 ID 부여
    if (isCloneMode && cloneSourceId === draggedData.id) {
      placedBox = {
        ...placedBox,
        id: Date.now()
      }
    }
    
    console.log('🎯 Created placed box:', placedBox)
    
    // 시간 충돌 감지
    const conflictBox = checkTimeConflict(placedBox)
    if (conflictBox) {
      console.log('⚠️ Time conflict detected with:', conflictBox.title)
      // 충돌 해결
      const resolvedBox = resolveTimeConflict(placedBox, conflictBox)
      placedBox = resolvedBox
      
      // 사용자에게 알림
      const message = `⚠️ 시간 충돌! "${conflictBox.title}"와 겹쳐서 ${formatTime(resolvedBox.startHour, resolvedBox.startMinute)}로 자동 이동했습니다.`
      setConflictMessage(message)
      console.log(message)
      
      // 3초 후 메시지 자동 제거
      setTimeout(() => setConflictMessage(null), 3000)
    }
    
    // 배치된 박스 목록에 추가 또는 업데이트
    if (isDraggingFromTimeline) {
      // 타임라인에서 이동한 경우: 기존 박스 업데이트
      setPlacedBoxes(prev => {
        const filtered = prev.filter(box => box.id !== draggedData.id)
        const newBoxes = [...filtered, placedBox]
        console.log('🔄 Moved box in timeline:', newBoxes)
        return newBoxes
      })
    } else {
      // 사이드바에서 추가한 경우
      if (!isCloneMode) {
        // 일반 모드: 사이드바에서 제거
        setPlanboxData(prev => prev.filter(box => box.id !== draggedData.id))
      }
      setPlacedBoxes(prev => {
        const newBoxes = [...prev, placedBox]
        console.log('🔄 Added new box to timeline:', newBoxes)
        return newBoxes
      })
    }
  }

  // 카테고리별 그라데이션 색상 반환 - 새로운 팔레트
  const getCategoryGradient = (category: string): string => {
    switch (category) {
      case 'food':
        return 'linear-gradient(135deg, #f35b04 0%, #e94700 100%)'
      case 'transport':
        return 'linear-gradient(135deg, #f18701 0%, #e57600 100%)'
      case 'activity':
        return 'linear-gradient(135deg, #f7b801 0%, #e5a900 100%)'
      case 'sightseeing':
        return 'linear-gradient(135deg, #7678ed 0%, #5f61e6 100%)'
      case 'shopping':
        return 'linear-gradient(135deg, #3d348b 0%, #2d2670 100%)'
      case 'accommodation':
        return 'linear-gradient(135deg, #62b6cb 0%, #4fa3b8 100%)'
      default:
        return 'linear-gradient(135deg, #ced4da 0%, #adb5bd 100%)'
    }
  }

  // 카테고리별 단색 반환 - 새로운 팔레트
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'food':
        return '#f35b04'      // 오렌지
      case 'transport':
        return '#f18701'      // 황금색
      case 'activity':
        return '#f7b801'      // 노란색
      case 'sightseeing':
        return '#7678ed'      // 보라색
      case 'shopping':
        return '#3d348b'      // 진한 보라
      case 'accommodation':
        return '#62b6cb'      // 청록색
      default:
        return '#ced4da'      // 회색
    }
  }

  // 리사이징 이벤트 핸들러들
  const handleResizeStart = (e: React.MouseEvent, box: PlanBox, direction: 'top' | 'bottom' = 'bottom') => {
    e.stopPropagation() // 박스 클릭 이벤트 방지
    setResizingBox(box)
    setResizeDirection(direction) // 리사이즈 방향 설정 추가
    setResizeStartY(e.clientY)
    setResizeOriginalHeight(box.height || 60)
    if (direction === 'top') {
      setResizeOriginalTop(box.startMinute || 0)
    }
  }

  // 리사이즈 핸들러를 useEffect로 관리해서 상태 참조 문제 해결
  useEffect(() => {
    if (!resizingBox) return

    const handleResizeMove = (e: MouseEvent) => {
      if (!resizingBox || !resizeDirection) return
      
      const deltaY = e.clientY - resizeStartY
      
      if (resizeDirection === 'bottom') {
        // 하단 리사이즈 - 더 부드러운 10분 단위 스냅
        // 1픽셀 = 1분 비율로 계산
        const pixelToMinute = 1
        const rawDurationMinutes = resizeOriginalHeight + (deltaY * pixelToMinute)
        const newDurationMinutes = Math.max(30, Math.round(rawDurationMinutes / 10) * 10) // 10분 단위로 스냅, 최소 30분
        
        // 시간배지 표시
        const startTimeText = formatTime(resizingBox.startHour, resizingBox.startMinute)
        const totalMinutes = (resizingBox.startHour! * 60 + resizingBox.startMinute!) + newDurationMinutes
        const endHour = Math.floor(totalMinutes / 60)
        const endMinute = totalMinutes % 60
        const endTimeText = formatTime(endHour, endMinute)
        
        setTimeBadge({
          x: e.clientX + 20,
          y: e.clientY,
          text: `${startTimeText} ~ ${endTimeText}`
        })
        
        // 플랜박스 업데이트
        setPlacedBoxes(prev => prev.map(box => 
          box.id === resizingBox.id && box.dayIndex === resizingBox.dayIndex ?
            {
              ...box,
              height: newDurationMinutes,
              durationHour: Math.floor(newDurationMinutes / 60),
              durationMinute: newDurationMinutes % 60
            } : box
        ))
        
        // 사이드바 원본도 업데이트
        setPlanboxData(prev => prev.map(box => 
          box.id === resizingBox.id ?
            {
              ...box,
              durationHour: Math.floor(newDurationMinutes / 60),
              durationMinute: newDurationMinutes % 60
            } : box
        ))
      } else if (resizeDirection === 'top') {
        // 상단 리사이즈 - 더 부드러운 10분 단위 스냅
        // 1픽셀 = 1분 비율로 계산
        const pixelToMinute = 1
        const rawDurationMinutes = resizeOriginalHeight - (deltaY * pixelToMinute)
        const newDurationMinutes = Math.max(30, Math.round(rawDurationMinutes / 10) * 10) // 10분 단위로 스냅, 최소 30분
        
        // 시작 시간 조정 (현재 종료 시간에서 새로운 지속 시간을 뺀 값)
        const currentEndMinutes = (resizingBox.startHour! * 60 + (resizingBox.startMinute || 0)) + 
                                  (resizingBox.durationHour || 0) * 60 + (resizingBox.durationMinute || 30)
        const newStartMinutes = Math.max(0, currentEndMinutes - newDurationMinutes)
        const newStartHour = Math.floor(newStartMinutes / 60)
        const newStartMinute = Math.round(newStartMinutes / 10) * 10 % 60 // 10분 단위 스냅
        
        if (newDurationMinutes >= 30) {
          
          // 시간배지 표시
          const startTimeText = formatTime(newStartHour, newStartMinute)
          const endTotalMinutes = (newStartHour * 60 + newStartMinute) + newDurationMinutes
          const endHour = Math.floor(endTotalMinutes / 60)
          const endMinute = endTotalMinutes % 60
          const endTimeText = formatTime(endHour, endMinute)
          
          setTimeBadge({
            x: e.clientX + 20,
            y: e.clientY - 30,
            text: `${startTimeText} ~ ${endTimeText}`
          })
          
          // 플랜박스 업데이트
          setPlacedBoxes(prev => prev.map(box => 
            box.id === resizingBox.id && box.dayIndex === resizingBox.dayIndex ?
              {
                ...box,
                startHour: newStartHour,
                startMinute: newStartMinute,
                top: newStartMinute,
                height: newDurationMinutes,
                durationHour: Math.floor(newDurationMinutes / 60),
                durationMinute: newDurationMinutes % 60
              } : box
          ))
          
          // 사이드바 원본도 업데이트
          setPlanboxData(prev => prev.map(box => 
            box.id === resizingBox.id ?
              {
                ...box,
                startHour: newStartHour,
                startMinute: newStartMinute,
                durationHour: Math.floor(newDurationMinutes / 60),
                durationMinute: newDurationMinutes % 60
              } : box
          ))
        }
      }
    }

    const handleResizeEnd = () => {
      setResizingBox(null)
      setResizeStartY(0)
      setResizeOriginalHeight(0)
      setResizeDirection(null)
      setResizeOriginalTop(0)
      setTimeBadge(null) // 시간배지 제거
    }

    // 리사이즈 이벤트 리스너 추가
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)

    // 클린업 함수
    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [resizingBox, resizeDirection, resizeStartY, resizeOriginalHeight, resizeOriginalTop])

  // localStorage 저장 함수 (에러 처리 강화)
  const saveToStorage = () => {
    const dataToSave = {
      planboxData,
      placedBoxes,
      tripTitle,
      startDate,
      endDate,
      totalDays,
      dayTimeRanges,
      lastSaved: new Date().toISOString()
    }
    
    try {
      const jsonString = JSON.stringify(dataToSave)
      
      // 용량 체크 (5MB 제한)
      if (jsonString.length > 5 * 1024 * 1024) {
        console.warn('⚠️ 저장 데이터가 5MB를 초과합니다. 일부 데이터를 정리해주세요.')
        return
      }
      
      localStorage.setItem('tplan-data', jsonString)
      console.log('데이터 자동저장 완료:', dataToSave.lastSaved)
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        console.error('💾 localStorage 용량 초과! 저장 공간을 확보해주세요.')
        alert('저장 공간이 부족합니다. 브라우저 캐시를 정리해주세요.')
      } else {
        console.error('데이터 저장 실패:', error)
      }
    }
  }

  // localStorage 불러오기 함수 (에러 처리 강화)
  const loadFromStorage = () => {
    try {
      const savedData = localStorage.getItem('tplan-data')
      if (savedData) {
        let data
        try {
          data = JSON.parse(savedData)
        } catch (parseError) {
          console.error('저장된 데이터 파싱 실패. 데이터가 손상되었을 수 있습니다:', parseError)
          // 손상된 데이터 제거
          localStorage.removeItem('tplan-data')
          initializeDefaultData()
          return
        }
        
        // 데이터 유효성 검증
        if (typeof data !== 'object' || data === null) {
          console.warn('저장된 데이터 형식이 올바르지 않습니다.')
          initializeDefaultData()
          return
        }
        
        // 저장된 데이터 복원 (안전한 기본값 제공)
        setPlanboxData(Array.isArray(data.planboxData) ? data.planboxData : [])
        setPlacedBoxes(Array.isArray(data.placedBoxes) ? data.placedBoxes : [])
        setTripTitle(typeof data.tripTitle === 'string' ? data.tripTitle : '도쿄 여행')
        setStartDate(typeof data.startDate === 'string' ? data.startDate : '2025-01-15')
        setEndDate(typeof data.endDate === 'string' ? data.endDate : '2025-01-21')
        setTotalDays(typeof data.totalDays === 'number' ? data.totalDays : 7)
        setDayTimeRanges(typeof data.dayTimeRanges === 'object' ? data.dayTimeRanges : {})
        
        console.log('저장된 데이터 복원 완료:', data.lastSaved)
      } else {
        // 저장된 데이터가 없으면 기본 데이터 초기화
        initializeDefaultData()
        console.log('기본 데이터로 초기화')
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      // 오류 시 기본 데이터로 초기화
      initializeDefaultData()
    }
  }

  // 데이터 초기화 함수
  const resetAllData = () => {
    localStorage.removeItem('tplan-data')
    setPlanboxData([])
    setPlacedBoxes([])
    setTripTitle('도쿄 여행')
    setStartDate('2025-01-15')
    setEndDate('2025-01-21')
    setTotalDays(7)
    setDayTimeRanges({})
    initializeDefaultData()
    console.log('모든 데이터 초기화 완료')
  }

  // 프로토타입 완전 동일한 초기 데이터 및 자동저장 복원
  useEffect(() => {
    loadFromStorage() // 저장된 데이터 먼저 로드
    updateTimeline()
  }, [])

  // 자동저장 - 데이터 변경시마다 저장
  useEffect(() => {
    if (planboxData.length > 0 || placedBoxes.length > 0) {
      saveToStorage()
    }
  }, [planboxData, placedBoxes, tripTitle, startDate, endDate, totalDays, dayTimeRanges])

  function initializeDefaultData() {
    const defaultData: PlanBox[] = [
      {
        id: 1,
        title: '도쿄역',
        category: 'transport',
        startHour: null,
        startMinute: null,
        durationHour: 0,
        durationMinute: 30,
        cost: '무료',
        memo: '신칸센 하차 후 JR패스로 이동',
        hasTimeSet: false
      },
      {
        id: 2,
        title: '아사쿠사 센소지',
        category: 'sightseeing',
        startHour: null,
        startMinute: null,
        durationHour: 2,
        durationMinute: 0,
        cost: '무료',
        memo: '도쿄 대표 사찰, 아사쿠사 문화거리 구경',
        hasTimeSet: false
      },
      {
        id: 3,
        title: '이치란 라멘',
        category: 'food',
        startHour: 12,
        startMinute: 30,
        durationHour: 1,
        durationMinute: 0,
        cost: '2,000엔',
        memo: '유명한 돈코츠 라멘집. 개인 부스에서 식사',
        hasTimeSet: true
      },
      {
        id: 4,
        title: '심야버스',
        category: 'transport',
        startHour: 23,
        startMinute: 30,
        durationHour: 7,
        durationMinute: 0,
        cost: '8,000엔',
        memo: '도쿄→오사카 심야버스',
        hasTimeSet: true
      }
    ]

    setPlanboxData(defaultData)
  }

  // 타임라인 업데이트 함수
  function updateTimeline() {
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    const days = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    if (days > 0 && days <= 14) {
      setTotalDays(days)
      
      // 각 날짜별 시간 범위 초기화
      const newTimeRanges: {[key: number]: TimeRange} = {}
      for (let i = 0; i < days; i++) {
        newTimeRanges[i] = { start: timeRangeStart, end: timeRangeEnd }
      }
      setDayTimeRanges(newTimeRanges)
    } else {
      alert('여행 기간은 1일에서 14일 사이로 설정해주세요')
    }
  }

  // 시간 슬롯 생성
  const generateTimeSlots = (dayIndex: number) => {
    const range = dayTimeRanges[dayIndex] || DEFAULT_TIME_RANGE
    const slots = []
    for (let hour = range.start; hour < range.end; hour++) {
      slots.push(hour)
    }
    return slots
  }
  
  // 시간 범위 프리셋 설정
  const setTimePreset = (dayIndex: number, preset: string) => {
    const newRanges = { ...dayTimeRanges }
    switch(preset) {
      case '새벽':
        newRanges[dayIndex] = { start: 0, end: 6 }
        break
      case '오전':
        newRanges[dayIndex] = { start: 6, end: 12 }
        break
      case '오후':
        newRanges[dayIndex] = { start: 12, end: 18 }
        break
      case '저녁':
        newRanges[dayIndex] = { start: 18, end: 24 }
        break
      case '표준':
      default:
        newRanges[dayIndex] = { ...DEFAULT_TIME_RANGE }
        break
    }
    setDayTimeRanges(newRanges)
  }
  
  // 커스텀 시간 설정
  const setCustomTimeRange = (dayIndex: number, start: number, end: number) => {
    if (start >= 0 && start < 24 && end > start && end <= 24) {
      const newRanges = { ...dayTimeRanges }
      newRanges[dayIndex] = { start, end }
      setDayTimeRanges(newRanges)
      return true
    }
    return false
  }

  // 시간 블록 클래스 - 프로토타입과 동일
  const getTimeBlockClass = (hour: number) => {
    if (hour >= 0 && hour < 6) return 'dawn-block'
    if (hour >= 6 && hour < 12) return 'morning-block' 
    if (hour >= 12 && hour < 18) return 'afternoon-block'
    return 'evening-block'
  }

  // 카테고리별 빠른 생성
  function createQuickBox(category: string) {
    const categoryDefaults: {[key: string]: {label: string, duration: number, color: string}} = {
      'food': { label: '식사', duration: 60, color: '#FF9800' },
      'transport': { label: '이동', duration: 60, color: '#4CAF50' },
      'activity': { label: '활동', duration: 60, color: '#2196F3' },
      'sightseeing': { label: '관광', duration: 60, color: '#9C27B0' },
      'shopping': { label: '쇼핑', duration: 60, color: '#E91E63' },
      'accommodation': { label: '숙박', duration: 60, color: '#673AB7' }
    }
    
    const defaults = categoryDefaults[category] || { label: '일정', duration: 60, color: '#f5f5f5' }
    
    const quickData: PlanBox = {
      id: Date.now(),
      title: defaults.label,
      category: category,
      startHour: null,
      startMinute: null,
      durationHour: Math.floor(defaults.duration / 60),
      durationMinute: defaults.duration % 60,
      cost: '',
      memo: '',
      hasTimeSet: false
    }
    
    setPlanboxData(prev => [...prev, quickData])
    
    if (categoryFilter !== 'all' && categoryFilter !== category) {
      setCategoryFilter('all')
    }
  }

  // 이동박스 생성
  function createTransportBox() {
    createQuickBox('transport')
  }

  // 필터링된 플랜박스 목록
  const filteredPlanBoxes = categoryFilter === 'all' 
    ? planboxData 
    : planboxData.filter(box => box.category === categoryFilter)

  // 비용 계산 함수
  const calculateTotalCost = () => {
    let total = 0
    let costs: {[key: string]: number} = {}
    
    // 모든 플랜박스의 비용 계산 (사이드바 + 배치된 박스)
    const allBoxes = [...planboxData, ...placedBoxes]
    
    allBoxes.forEach(box => {
      const costStr = box.cost || '0'
      let cost = 0
      
      // 비용 파싱 (숫자만 추출)
      if (costStr && costStr !== '무료' && costStr !== '0') {
        const numericCost = parseInt(costStr.replace(/[^\d]/g, '')) || 0
        cost = numericCost
        
        // 카테고리별 합계
        if (!costs[box.category]) {
          costs[box.category] = 0
        }
        costs[box.category] += cost
      }
      
      total += cost
    })
    
    return { total, costs }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  // 시간 충돌 감지 함수
  const checkTimeConflict = (newBox: PlanBox, existingBoxes: PlanBox[] = placedBoxes): PlanBox | null => {
    if (newBox.startHour === null || newBox.startHour === undefined || newBox.dayIndex === undefined) return null
    
    const newStart = newBox.startHour * 60 + (newBox.startMinute || 0)
    const newEnd = newStart + (newBox.durationHour * 60) + newBox.durationMinute
    
    return existingBoxes.find(box => {
      if (box.dayIndex !== newBox.dayIndex || !box.startHour || box.id === newBox.id) return false
      
      const boxStart = box.startHour * 60 + (box.startMinute || 0)
      const boxEnd = boxStart + (box.durationHour * 60) + box.durationMinute
      
      // 시간 겹침 확인
      return (newStart < boxEnd && newEnd > boxStart)
    }) || null
  }

  // 충돌 해결 - 자동으로 빈 시간대 찾기
  const resolveTimeConflict = (newBox: PlanBox, conflictBox: PlanBox): PlanBox => {
    const conflictStart = conflictBox.startHour! * 60 + (conflictBox.startMinute || 0)
    const conflictEnd = conflictStart + (conflictBox.durationHour * 60) + conflictBox.durationMinute
    const newDuration = (newBox.durationHour * 60) + newBox.durationMinute
    
    // 충돌 박스 종료 시간에 배치
    const newStartMinutes = conflictEnd
    const newStartHour = Math.floor(newStartMinutes / 60)
    const newStartMinute = newStartMinutes % 60
    
    return {
      ...newBox,
      startHour: newStartHour,
      startMinute: newStartMinute,
      top: newStartMinute // 시각적 위치 조정
    }
  }

  // 압축 모드용 - 사용된 시간 슬롯만 필터링
  const getUsedTimeSlots = (dayIndex: number) => {
    const range = dayTimeRanges[dayIndex] || { start: timeRangeStart, end: timeRangeEnd }
    const usedSlots = new Set<number>()
    
    // 해당 날짜에 배치된 플랜박스들의 시간 수집
    placedBoxes
      .filter(box => box.dayIndex === dayIndex && box.startHour !== null)
      .forEach(box => {
        const startHour = box.startHour!
        const endHour = Math.ceil((startHour * 60 + (box.startMinute || 0) + (box.height || 60)) / 60)
        
        for (let hour = startHour; hour < Math.min(endHour, range.end); hour++) {
          usedSlots.add(hour)
        }
      })
    
    // 사용된 시간 슬롯만 반환 (최소 3개는 표시)
    const slotsArray = Array.from(usedSlots).sort((a, b) => a - b)
    if (slotsArray.length < 3) {
      // 빈 여행일 경우 기본 시간대 표시
      return [range.start, range.start + 1, range.start + 2]
    }
    
    return slotsArray
  }

  // 인쇄 함수
  const handlePrint = () => {
    // 인쇄 모드로 전환
    setViewMode('print')
    
    // 잠시 후 인쇄 실행
    setTimeout(() => {
      window.print()
      // 인쇄 후 원래 모드로 복원
      setViewMode('edit')
    }, 100)
  }

  // 모달 열기
  function showAddModal() {
    const newPlanBox: PlanBox = {
      id: Date.now(),
      title: '새 플랜',
      category: 'activity',
      startHour: null,
      startMinute: null,
      durationHour: 2,
      durationMinute: 0,
      cost: '',
      memo: '',
      location: '',
      hasTimeSet: false
    }
    setCurrentPlanBox(newPlanBox)
    setIsEditing(false)
    setIsModalOpen(true)
  }

  // 플랜박스 편집
  function editPlanBox(planBox: PlanBox) {
    setCurrentPlanBox({...planBox})
    setIsEditing(true)
    setIsModalOpen(true)
  }

  // 모달 닫기
  function hideModal() {
    setIsModalOpen(false)
    setCurrentPlanBox(null)
    setModalTitleEditing(false)
  }

  // 플랜박스 저장
  function savePlanBox() {
    if (!currentPlanBox) return
    
    if (isEditing) {
      setPlanboxData(prev => prev.map(box => 
        box.id === currentPlanBox.id ? currentPlanBox : box
      ))
      setPlacedBoxes(prev => prev.map(box => 
        box.id === currentPlanBox.id ? currentPlanBox : box
      ))
    } else {
      setPlanboxData(prev => [...prev, currentPlanBox])
    }
    
    hideModal()
  }

  // 카카오 장소 검색
  const searchPlaces = useCallback((query: string) => {
    if (!query || !window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      return
    }
    
    setIsSearching(true)
    const ps = new window.kakao.maps.services.Places()
    
    ps.keywordSearch(query, (data: any, status: any) => {
      setIsSearching(false)
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data.slice(0, 5)) // 상위 5개만 표시
      } else {
        setSearchResults([])
      }
    })
  }, [])
  
  // 검색어 입력 처리 (디바운싱)
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
  
  // 장소 선택
  const selectPlace = (place: any) => {
    if (currentPlanBox) {
      setCurrentPlanBox({
        ...currentPlanBox,
        title: place.place_name,
        location: place.road_address_name || place.address_name,
        memo: place.phone ? `📞 ${place.phone}\n${currentPlanBox.memo}` : currentPlanBox.memo
      })
    }
    setSearchQuery('')
    setSearchResults([])
  }

  // 플랜박스 삭제
  function deletePlanBox(id: number) {
    setPlanboxData(prev => prev.filter(box => box.id !== id))
    setPlacedBoxes(prev => prev.filter(box => box.id !== id))
    hideModal()
  }

  // 무한 복제 모드 토글
  function toggleCloneMode(id: number) {
    if (cloneSourceId === id) {
      setCloneSourceId(null)
      setIsCloneMode(false)
    } else {
      setCloneSourceId(id)
      setIsCloneMode(true)
    }
  }

  // 제목 편집 시작
  function startTitleEdit() {
    setModalTitleEditing(true)
    setTimeout(() => {
      if (modalTitleEditRef.current) {
        modalTitleEditRef.current.focus()
        modalTitleEditRef.current.select()
      }
    }, 0)
  }

  // 제목 편집 종료
  function finishTitleEdit() {
    setModalTitleEditing(false)
  }

  // 키보드 이벤트
  function handleTitleEditKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      finishTitleEdit()
    }
  }

  // 종료 시간 계산
  function calculateEndTime(startHour: number, startMinute: number, durationHour: number, durationMinute: number) {
    const totalStartMinutes = startHour * 60 + startMinute
    const totalDurationMinutes = durationHour * 60 + durationMinute
    const totalEndMinutes = totalStartMinutes + totalDurationMinutes
    
    const endHour = Math.floor(totalEndMinutes / 60) % 24
    const endMinute = totalEndMinutes % 60
    
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
  }

  // 시간 포맷팅
  function formatTime(hour: number | null, minute: number | null) {
    if (hour === null || minute === null) return '미설정'
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  // 소요시간 포맷팅
  function formatDuration(hour: number, minute: number) {
    if (hour === 0 && minute === 0) return '0분'
    if (hour === 0) return `${minute}분`
    if (minute === 0) return `${hour}시간`
    return `${hour}시간 ${minute}분`
  }

  return (
    <div className="edit-mode">
      {/* 시간배지 표시 */}
      {timeBadge && (
        <div style={{
          position: 'fixed',
          left: `${timeBadge.x}px`,
          top: `${timeBadge.y}px`,
          background: '#ff4757',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(255, 71, 87, 0.4)',
          whiteSpace: 'nowrap'
        }}>
          {timeBadge.text}
        </div>
      )}
      
      
      {/* 헤더 - 프로토타입 완전 동일 */}
      <div className="header">
        <div className="header-logo">
          <div className="logo-icon">T</div>
          {/* 임시 초기화 버튼 - 왼쪽 끝 */}
          <button 
            className="btn-reset-temp" 
            onClick={() => {
              if (confirm('모든 데이터를 초기화하시겠습니까?')) {
                resetAllData();
              }
            }}
            style={{
              position: 'absolute',
              left: '80px',
              padding: '4px 10px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              opacity: 0.8
            }}
            title="임시 초기화 버튼"
          >
            초기화(임시)
          </button>
        </div>
        
        {/* 충돌 알림 메시지 */}
        {conflictMessage && (
          <div style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
            zIndex: 1000,
            animation: 'slideDown 0.3s ease-out'
          }}>
            {conflictMessage}
          </div>
        )}
        
        {/* 뷰 모드 토글 */}

        <div className="header-controls" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: '8px'
        }}>
          <input 
            type="text" 
            id="tripTitle"
            placeholder="여행 제목"
            value={tripTitle}
            onChange={(e) => setTripTitle(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              width: '150px',
              textAlign: 'center'
            }}
          />
          <input 
            type="date"
            id="startDate" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: '5px 8px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          />
          <span style={{color: '#868e96', fontWeight: '500'}}>~</span>
          <input 
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: '5px 8px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          />
          <div style={{marginLeft: '16px', display: 'flex', gap: '6px'}}>
            <button 
              className="btn-header" 
              onClick={updateTimeline}
              style={{
                padding: '6px 14px',
                background: '#4263eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              적용
            </button>
            <button 
              className="btn-print" 
              onClick={handlePrint}
              style={{
                padding: '6px 14px',
                background: '#868e96',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              인쇄
            </button>
            <button 
              className="btn-save" 
              onClick={() => {
                // 저장 기능
                const dataToSave = {
                  tripTitle,
                  startDate,
                  endDate,
                  planboxData,
                  placedBoxes
                };
                localStorage.setItem('tripPlanData', JSON.stringify(dataToSave));
                alert('저장되었습니다!');
              }}
              style={{
                padding: '6px 14px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
      
      {/* 메인 레이아웃 */}
      <div className="main-layout" style={{
        display: 'grid',
        gridTemplateColumns: 'calc(100% - 320px) 320px',
        height: 'calc(100vh - 56px)',
        background: '#f8f9fa',
        position: 'absolute',
        top: '56px',
        left: 0,
        right: 0,
        bottom: 0
      }}>
        {/* 타임라인 영역 - 왼쪽 */}
        <div className="timeline-area" style={{
          background: '#fff',
          overflow: 'auto',
          position: 'relative',
          margin: '0',
          borderRadius: '0',
          boxShadow: 'none',
          height: '100%'
        }}>
          <div className="timeline-container" style={{
            display: 'flex',
            minWidth: 'fit-content',
            position: 'relative',
            paddingBottom: '20px'
          }}>
            {/* 시간 라벨 - ADAPTIVE에서는 숨김 */}
            <div className="time-labels" id="timeLabels"></div>
            
            {/* 날짜 컬럼들 */}
            <div className="day-columns" id="dayColumns">
              {Array.from({length: totalDays}, (_, dayIndex) => (
                <div key={dayIndex} className="flex">
                  {/* 개별 타임바 */}
                  <div className="day-timebar" style={{
                    width: '30px',  // 35px에서 30px로 살짝 줄임
                    background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRight: '1px solid #dee2e6',
                    position: 'relative'
                  }}>
                    <div className="time-range-header" style={{
                      padding: '4px 2px',
                      borderBottom: '1px solid #dee2e6',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      writingMode: 'vertical-rl',  // 세로 쓰기 모드
                      textOrientation: 'mixed'
                    }}>
                      <button 
                        className="preset-btn"
                        onClick={() => {
                          setCurrentSettingDay(dayIndex)
                          setIsTimeSettingModalOpen(true)
                        }}
                        style={{
                          fontSize: '11px',  // 8px에서 11px로 확대
                          fontWeight: '600',
                          padding: '2px',
                          background: 'transparent',
                          color: '#495057',
                          border: 'none',
                          cursor: 'pointer',
                          letterSpacing: '0.5px'
                        }}
                      >설정</button>
                    </div>
                    
                    {/* 개별 시간 라벨 */}
                    {(viewMode === 'compress' ? getUsedTimeSlots(dayIndex) : generateTimeSlots(dayIndex)).map(hour => (
                      <div key={hour} className="time-label" style={{
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',  // 11px에서 14px로 확대
                        fontWeight: '600',  // 굵게 표시
                        color: '#495057',
                        borderBottom: '1px solid #e0e0e0'
                      }}>
                        {hour}
                      </div>
                    ))}
                  </div>
                  
                  {/* 날짜 컬럼 */}
                  <div className="day-column">
                    <div className="day-header">
                      Day {dayIndex + 1}
                    </div>
                    
                    {/* 시간 그리드 */}
                    <div className="time-grid">
                      {(viewMode === 'compress' ? getUsedTimeSlots(dayIndex) : generateTimeSlots(dayIndex)).map(hour => (
                        <div 
                          key={hour}
                          className="time-slot"
                          data-day={dayIndex}
                          data-hour={hour}
                          onDragOver={handleSlotDragOver}
                          onDragLeave={handleSlotDragLeave}
                          onDrop={handleSlotDrop}
                        >
                          {/* 10분 단위 서브 슬롯 */}
                          <div className="absolute inset-0 grid grid-rows-3">
                            <div data-minute={10}></div>
                            <div data-minute={30}></div>
                            <div data-minute={50}></div>
                          </div>
                          
                          {/* 드래그 고스트 - 해당 슬롯에 표시 */}
                          {dragGhost && dragGhost.dayIndex === dayIndex && dragGhost.hour === hour && (
                            <div
                              className={`drag-ghost ${dragGhost.category || 'activity'}`}
                              style={{
                                position: 'absolute',
                                top: `${dragGhost.minute}px`,
                                left: '0',
                                right: '0',
                                height: `${dragGhost.height}px`,
                                pointerEvents: 'none',
                                opacity: 0.5,
                                background: dragGhost.category === 'food' ? 'rgba(255, 193, 7, 0.3)' :
                                           dragGhost.category === 'transport' ? 'rgba(40, 167, 69, 0.3)' :
                                           dragGhost.category === 'activity' ? 'rgba(74, 144, 226, 0.3)' :
                                           dragGhost.category === 'sightseeing' ? 'rgba(163, 116, 249, 0.3)' :
                                           dragGhost.category === 'shopping' ? 'rgba(255, 107, 157, 0.3)' :
                                           dragGhost.category === 'accommodation' ? 'rgba(173, 80, 210, 0.3)' :
                                           'rgba(74, 144, 226, 0.3)',
                                borderTop: `2px dashed ${getCategoryColor(dragGhost.category)}`,
                                borderBottom: `2px dashed ${getCategoryColor(dragGhost.category)}`,
                                borderLeft: `4px solid ${getCategoryColor(dragGhost.category)}`,
                                borderRight: 'none',
                                borderRadius: '0',
                                zIndex: 5,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                color: getCategoryColor(dragGhost.category),
                                fontWeight: 'bold',
                                gap: '2px'
                              }}
                            >
                              <div>{dragGhost.title}</div>
                              <div style={{fontSize: '10px'}}>
                                {formatDuration(Math.floor(dragGhost.height / 60), dragGhost.height % 60)}
                              </div>
                            </div>
                          )}
                          
                          {/* 배치된 플랜박스들 렌더링 - 해당 시간 슬롯에서 시작하는 박스만 */}
                          {placedBoxes
                            .filter(box => {
                              const matches = box.dayIndex === dayIndex && box.startHour === hour
                              if (matches) {
                                console.log('📍 Rendering box in slot:', { title: box.title, dayIndex, hour, boxDay: box.dayIndex, boxHour: box.startHour })
                              }
                              return matches
                            })
                            .map(box => {
                              // 같은 날의 다음 박스 찾기 (갭 표시용)
                              const sameDayBoxes = placedBoxes
                                .filter(b => b.dayIndex === dayIndex)
                                .sort((a, b) => (a.startHour * 60 + (a.startMinute || 0)) - (b.startHour * 60 + (b.startMinute || 0)));
                              
                              const currentBoxIndex = sameDayBoxes.findIndex(b => b.id === box.id);
                              const nextBox = sameDayBoxes[currentBoxIndex + 1];
                              
                              // 갭 계산
                              let gapMinutes = 0;
                              if (nextBox) {
                                const currentEndTime = box.startHour * 60 + (box.startMinute || 0) + (box.height || 60);
                                const nextStartTime = nextBox.startHour * 60 + (nextBox.startMinute || 0);
                                gapMinutes = nextStartTime - currentEndTime;
                              }
                              
                              return (
                              <div
                                key={`placed-${box.id}-${box.dayIndex}-${box.startHour}`}
                                className={`placed-box ${box.category}`}
                                draggable={!resizingBox}
                                onDragStart={(e) => {
                                  handleDragStart(e, box, true)  // isFromTimeline = true
                                  e.dataTransfer.setData('isFromTimeline', 'true')
                                }}
                                onDragEnd={handleDragEnd}
                                onMouseDown={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  const y = e.clientY - rect.top
                                  
                                  if (y <= 10) {
                                    // 상단 리사이즈
                                    e.preventDefault()
                                    console.log('🔄 Top resize started for:', box.title)
                                    handleResizeStart(e, box, 'top')
                                  } else if (y >= rect.height - 10) {
                                    // 하단 리사이즈
                                    e.preventDefault()
                                    console.log('🔄 Bottom resize started for:', box.title)
                                    handleResizeStart(e, box, 'bottom')
                                  }
                                }}
                                style={{
                                  position: 'absolute',
                                  top: `${Math.round((box.startMinute || 0) / 10) * 10}px`, // 10분 단위 스냅
                                  left: '0',
                                  right: '0',
                                  height: `${Math.round((box.height || 60) / 10) * 10}px`, // 10분 단위 높이
                                  background: box.category === 'food' ? 'linear-gradient(90deg, #FFF5E6 0%, #FFEFDD 100%)' :
                                             box.category === 'transport' ? 'linear-gradient(90deg, #E6FFF5 0%, #DFFFF0 100%)' :
                                             box.category === 'activity' ? 'linear-gradient(90deg, #EBF3FF 0%, #E1EDFF 100%)' :
                                             box.category === 'sightseeing' ? 'linear-gradient(90deg, #F4EDFF 0%, #EDE4FF 100%)' :
                                             box.category === 'shopping' ? 'linear-gradient(90deg, #FFEBF2 0%, #FFDFEA 100%)' :
                                             box.category === 'accommodation' ? 'linear-gradient(90deg, #F0E9FF 0%, #E8DFFF 100%)' :
                                             'linear-gradient(90deg, #F8F9FA 0%, #F1F3F5 100%)',
                                  border: 'none',
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
                                  borderRadius: '0',
                                  padding: '4px',
                                  fontSize: '11px',
                                  color: '#000',
                                  zIndex: resizingBox?.id === box.id ? 15 : 10,
                                  cursor: resizingBox?.id === box.id ? 'ns-resize' : 'move',
                                  transition: resizingBox?.id === box.id ? 'none' : 'height 0.2s ease',
                                  overflow: 'hidden',
                                  minHeight: '30px'
                                }}
                                onDoubleClick={() => editPlanBox(box)}
                              >
                                {/* 왼쪽 카테고리 색상 라인 */}
                                <div style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: '4px',
                                  background: getCategoryColor(box.category),
                                  zIndex: 1
                                }} />
                                
                                {(() => {
                                  const duration = box.durationHour * 60 + box.durationMinute;
                                  const height = Math.max(box.height || 60, 40);
                                  const startTimeText = formatTime(box.startHour, box.startMinute);
                                  const durationText = formatDuration(box.durationHour, box.durationMinute);
                                  
                                  if (duration <= 40) {
                                    // 30분, 40분 - 시간과 제목만 (프로토타입과 동일)
                                    return (
                                      <div style={{position: 'relative', height: '100%', padding: '4px 6px', paddingRight: '25px'}}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                          <span style={{fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', color: '#000'}}>{startTimeText}</span>
                                          <div style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10px', fontWeight: '500', color: '#000'}}>{box.title}</div>
                                        </div>
                                        {/* 더보기 버튼 */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            editPlanBox(box)
                                          }}
                                          style={{
                                            position: 'absolute',
                                            top: '2px',
                                            right: '2px',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '2px',
                                            fontSize: '11px',
                                            color: '#666',
                                            lineHeight: 1
                                          }}
                                          title="편집"
                                        >
                                          ⋮
                                        </button>
                                      </div>
                                    );
                                  } else if (duration >= 50 && duration <= 70) {
                                    // 50분~1시간 10분
                                    return (
                                      <div style={{position: 'relative', height: '100%', padding: '4px 6px', paddingRight: '25px'}}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px'}}>
                                          <span style={{fontSize: '13px', fontWeight: '600', color: '#000'}}>{startTimeText}</span>
                                          <div style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', lineHeight: '1.2', color: '#000'}}>{box.title}</div>
                                        </div>
                                        {/* 더보기 버튼 */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            editPlanBox(box)
                                          }}
                                          style={{
                                            position: 'absolute',
                                            top: '2px',
                                            right: '2px',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '2px',
                                            fontSize: '11px',
                                            color: '#666',
                                            lineHeight: 1
                                          }}
                                          title="편집"
                                        >
                                          ⋮
                                        </button>
                                        
                                        <div style={{textAlign: 'right', marginBottom: '2px'}}>
                                          <span style={{fontSize: '10px', color: '#666', background: 'rgba(0,0,0,0.1)', padding: '1px 4px', borderRadius: '6px'}}>{durationText}</span>
                                        </div>
                                        
                                        {box.memo && height >= 50 && (
                                          <div style={{fontSize: '11px', color: '#555', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                            📝 {box.memo}
                                          </div>
                                        )}
                                        
                                        {box.cost && box.cost !== '무료' && height >= 60 && (
                                          <div style={{fontSize: '11px', color: '#555', marginTop: '2px'}}>
                                            💰 {box.cost}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  } else {
                                    // 1시간 10분 이상 (프로토타입과 동일한 레이아웃)
                                    const availableHeight = height - 60;
                                    const lineHeight = 14;
                                    const maxMemoLines = Math.max(1, Math.floor(availableHeight / lineHeight) - 2);
                                    const showLocation = height >= 120;
                                    const showFullInfo = height >= 90;
                                    
                                    return (
                                      <div style={{position: 'relative', height: '100%', padding: '4px 6px', paddingRight: '25px', display: 'flex', flexDirection: 'column'}}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px'}}>
                                          <span style={{fontSize: '14px', fontWeight: '600', color: '#000'}}>{startTimeText}</span>
                                          <div style={{flex: 1, lineHeight: '1.2', fontSize: '13px', fontWeight: '700', color: '#000'}}>{box.title}</div>
                                        </div>
                                        {/* 더보기 버튼 */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            editPlanBox(box)
                                          }}
                                          style={{
                                            position: 'absolute',
                                            top: '2px',
                                            right: '2px',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '2px',
                                            fontSize: '11px',
                                            color: '#666',
                                            lineHeight: 1
                                          }}
                                          title="편집"
                                        >
                                          ⋮
                                        </button>
                                        
                                        <div style={{textAlign: 'right', marginBottom: '3px'}}>
                                          <span style={{fontSize: '10px', color: '#666', background: 'rgba(0,0,0,0.1)', padding: '1px 4px', borderRadius: '6px'}}>{durationText}</span>
                                        </div>
                                        
                                        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '2px'}}>
                                          {box.memo && (
                                            <div style={{fontSize: '11px', color: '#555', lineHeight: '1.3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: maxMemoLines, WebkitBoxOrient: 'vertical'}}>
                                              📝 {box.memo}
                                            </div>
                                          )}
                                          
                                          {box.cost && box.cost !== '무료' && showFullInfo && (
                                            <div style={{fontSize: '11px', color: '#555'}}>
                                              💰 {box.cost}
                                            </div>
                                          )}
                                          
                                          {box.location && showLocation && (
                                            <div style={{fontSize: '11px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                              📍 {box.location}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }
                                })()}
                                
                                {/* 리사이즈 핸들 - 상단 */}
                                <div
                                  className="resize-handle resize-handle-top"
                                  style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    left: '0',
                                    right: '0',
                                    height: '6px',
                                    cursor: 'ns-resize',
                                    background: 'transparent',
                                    zIndex: 15
                                  }}
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    handleResizeStart(e, box, 'top')
                                  }}
                                >
                                  <div style={{
                                    position: 'absolute',
                                    top: '1px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '20px',
                                    height: '3px',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '2px'
                                  }} />
                                </div>
                                
                                {/* 리사이즈 핸들 - 하단 */}
                                <div
                                  className="resize-handle resize-handle-bottom"
                                  style={{
                                    position: 'absolute',
                                    bottom: '-2px',
                                    left: '0',
                                    right: '0',
                                    height: '6px',
                                    cursor: 'ns-resize',
                                    background: 'transparent',
                                    zIndex: 15
                                  }}
                                  onMouseDown={(e) => handleResizeStart(e, box)}
                                >
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '1px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '20px',
                                    height: '3px',
                                    background: 'rgba(255,255,255,0.6)',
                                    borderRadius: '2px'
                                  }} />
                                </div>
                              
                              {/* 갭 표시 - placed-box 내부 */}
                              {gapMinutes > 0 && nextBox && (
                                <div style={{
                                  position: 'absolute',
                                  top: `${Math.round((box.startMinute || 0) / 10) * 10 + Math.round((box.height || 60) / 10) * 10}px`,
                                  left: '0',
                                  right: '0',
                                  height: `${gapMinutes}px`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  pointerEvents: 'none',
                                  zIndex: 5
                                }}>
                                  <div style={{
                                    background: 'rgba(0, 0, 0, 0.03)',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '10px',
                                    color: '#999',
                                    border: '1px dashed #ddd'
                                  }}>
                                    ~{gapMinutes >= 60 ? `${Math.floor(gapMinutes / 60)}시간 ${gapMinutes % 60 > 0 ? `${gapMinutes % 60}분` : ''}` : `${gapMinutes}분`}~
                                  </div>
                                </div>
                              )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 플랜박스 영역 - 오른쪽 */}
        <div className="planbox-area" style={{
          background: 'white',
          margin: '0',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          borderLeft: '1px solid #dee2e6',
          position: 'fixed',
          right: 0,
          top: 0,
          width: '320px',
          zIndex: 100
        }}>
          
          {/* 플랜박스 생성 영역 */}
          <div 
            className="creation-zone" 
            style={{
              background: '#f8f9fa', 
              padding: '4px 6px', 
              borderBottom: '1px solid #dee2e6'
            }}
          >
            {/* 카테고리 빠른 생성 버튼 - 3x2 배열 */}
            <div 
              className="quick-category-buttons" 
              style={{
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '3px', 
                marginBottom: '3px'
              }}
            >
              <button 
                className="quick-btn cat-transport" 
                onClick={createTransportBox}
                style={{
                  padding: '6px 4px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#4CAF50',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 4px rgba(241,135,1,0.3)'
                }}
              >
                <span className="material-icons-outlined" style={{fontSize: '16px'}}>directions</span>
                이동
              </button>
              
              <button 
                className="quick-btn cat-activity" 
                onClick={() => createQuickBox('activity')}
                style={{
                  padding: '6px 4px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#2196F3',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 3px rgba(33,150,243,0.3)'
                }}
              >
                <span className="material-icons-outlined" style={{fontSize: '18px'}}>sports_soccer</span>
                활동
              </button>
              
              <button 
                className="quick-btn cat-sightseeing" 
                onClick={() => createQuickBox('sightseeing')}
                style={{
                  padding: '6px 4px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#9C27B0',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 3px rgba(156,39,176,0.3)'
                }}
              >
                <span className="material-icons-outlined" style={{fontSize: '18px'}}>photo_camera</span>
                관광
              </button>
              
              <button 
                className="quick-btn cat-food" 
                onClick={() => createQuickBox('food')}
                style={{
                  padding: '6px 4px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#FF9800',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 3px rgba(255,152,0,0.3)'
                }}
              >
                <span className="material-icons-outlined" style={{fontSize: '18px'}}>restaurant</span>
                식사
              </button>
              
              <button 
                className="quick-btn cat-shopping" 
                onClick={() => createQuickBox('shopping')}
                style={{
                  padding: '6px 4px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#F44336',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 3px rgba(233,30,99,0.3)'
                }}
              >
                <span className="material-icons-outlined" style={{fontSize: '18px'}}>shopping_bag</span>
                쇼핑
              </button>
              
              <button 
                className="quick-btn cat-accommodation" 
                onClick={() => createQuickBox('accommodation')}
                style={{
                  padding: '6px 4px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#00BCD4',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  boxShadow: '0 1px 2px rgba(103,58,183,0.3)'
                }}
              >
                <span className="material-icons-outlined" style={{fontSize: '18px'}}>hotel</span>
                숙박
              </button>
            </div>
            
            {/* 맞춤 플랜박스 버튼 */}
            <button 
              className="add-planbox-btn" 
              onClick={showAddModal}
              style={{
                width: '100%',
                padding: '6px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px'
              }}
            >
              ➕ 맞춤 플랜박스
            </button>
          </div>
          
          {/* 탭 시스템 */}
          <div style={{
            display: 'flex',
            background: 'white',
            borderBottom: '1px solid #dee2e6',
            padding: '0'
          }}>
            <button
              onClick={() => setPlanBoxTab('filter')}
              style={{
                flex: 1,
                padding: '10px',
                background: planBoxTab === 'filter' ? 'white' : '#f8f9fa',
                color: planBoxTab === 'filter' ? '#495057' : '#868e96',
                border: 'none',
                borderBottom: planBoxTab === 'filter' ? '2px solid #4263eb' : '2px solid transparent',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              필터
            </button>
            <button
              onClick={() => setPlanBoxTab('share')}
              style={{
                flex: 1,
                padding: '10px',
                background: planBoxTab === 'share' ? 'white' : '#f8f9fa',
                color: planBoxTab === 'share' ? '#495057' : '#868e96',
                border: 'none',
                borderBottom: planBoxTab === 'share' ? '2px solid #4263eb' : '2px solid transparent',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              공유
            </button>
          </div>
          
          
          {/* 공유 영역 - 탭에 따라 표시 */}
          {planBoxTab === 'share' && (
            <div 
              className="share-zone" 
              style={{
                padding: '10px', 
                background: 'white', 
                borderBottom: '1px solid #dee2e6',
                fontSize: '12px',
                color: '#868e96',
                textAlign: 'center'
              }}
            >
              공유 기능 준비 중...
            </div>
          )}
          
          {/* 플랜박스 목록 */}
          <div className="planbox-list" id="planboxList" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px'
          }}>
            {/* 필터 탭일 때 카테고리 선택 표시 */}
            {planBoxTab === 'filter' && (
              <div style={{
                marginBottom: '8px',
                padding: '6px',
                background: '#f8f9fa',
                borderRadius: '4px'
              }}>
                <select 
                  id="categoryFilter" 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    width: '100%', 
                    padding: '6px 8px', 
                    border: '1px solid #dee2e6', 
                    borderRadius: '4px', 
                    background: 'white', 
                    fontSize: '12px', 
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">전체 카테고리</option>
                  <option value="food">식사</option>
                  <option value="transport">이동</option>
                  <option value="activity">활동</option>
                  <option value="sightseeing">관광</option>
                  <option value="shopping">쇼핑</option>
                  <option value="accommodation">숙박</option>
                </select>
              </div>
            )}
            
            {/* 플랜박스 그리드 - 2열 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px'
            }}>
              {filteredPlanBoxes.length === 0 ? (
                <div style={{gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: '#6c757d', fontSize: '12px'}}>
                  선택한 카테고리의 플랜박스가 없습니다.
                </div>
              ) : (
                filteredPlanBoxes.map((planBox) => (
                <div 
                  key={planBox.id}
                  className={`planbox-item ${planBox.category}`}
                  draggable={true}
                  data-id={planBox.id}
                  style={{
                    background: getCategoryGradient(planBox.category),
                    border: cloneSourceId === planBox.id ? '2px dashed #667eea' : '1px solid #e9ecef',
                    padding: '6px',
                    cursor: 'move',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: '0',
                    opacity: draggedData?.id === planBox.id ? 0.5 : 1
                  }}
                  onDragStart={(e) => {
                    if (isCloneMode && cloneSourceId === planBox.id) {
                      // 클론 모드: 복제할 데이터 설정
                      const clonedBox = {
                        ...planBox,
                        id: Date.now(),
                        startHour: null,
                        startMinute: null,
                        hasTimeSet: false
                      }
                      handleDragStart(e, clonedBox)
                    } else {
                      handleDragStart(e, planBox)
                    }
                  }}
                  onDragEnd={handleDragEnd}
                  onDoubleClick={() => editPlanBox(planBox)}
                >
                  <div style={{position: 'relative', padding: '4px 4px 20px 4px', height: '100%', display: 'flex', flexDirection: 'column'}}>
                    {/* 상단: 시간 + 제목 */}
                    <div style={{display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '3px'}}>
                      <span className="planbox-time" style={{fontSize: '12px', color: '#fff', flexShrink: 0}}>
                        {planBox.startHour !== null && planBox.startMinute !== null && planBox.hasTimeSet ? 
                          formatTime(planBox.startHour, planBox.startMinute) : 
                          '시간 미설정'
                        }
                      </span>
                      <div className="planbox-title" style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', lineHeight: '1.2', color: '#fff', fontWeight: '600'}}>
                        {planBox.title}
                      </div>
                    </div>
                    
                    {/* 중간 컨텐츠 */}
                    <div style={{flex: 1}}>
                      {/* 메모 (있을 경우만 표시) */}
                      {planBox.memo && (
                        <div className="planbox-memo" style={{fontSize: '11px', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px'}}>
                          📝 {planBox.memo}
                        </div>
                      )}
                      
                      {/* 위치 (있을 경우만 표시) */}
                      {planBox.location && (
                        <div className="planbox-location" style={{fontSize: '11px', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px'}}>
                          📍 {planBox.location}
                        </div>
                      )}
                      
                      {/* 비용 (있을 경우만 표시) */}
                      {planBox.cost && (
                        <div className="planbox-cost" style={{fontSize: '11px', color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                          💰 {planBox.cost}
                        </div>
                      )}
                    </div>
                    
                    {/* 하단: 소요시간 (왼쪽) */}
                    <div style={{marginTop: 'auto', marginBottom: '8px'}}>
                      <span className="planbox-duration" style={{
                        fontSize: '10px', 
                        color: 'rgba(255,255,255,0.9)', 
                        background: 'rgba(255,255,255,0.2)', 
                        padding: '1px 4px', 
                        borderRadius: '4px'
                      }}>
                        {formatDuration(planBox.durationHour, planBox.durationMinute)}
                      </span>
                    </div>
                    
                    {/* 버튼 그룹 - 오른쪽 상단 */}
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      display: 'flex',
                      gap: '4px'
                    }}>
                      {/* 편집 버튼 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          editPlanBox(planBox)
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '2px 6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="편집"
                      >
                        ✏️
                      </button>
                      
                      {/* 복제 버튼 */}
                      <button 
                        className={`clone-btn ${cloneSourceId === planBox.id ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCloneMode(planBox.id)
                        }}
                        style={{
                          background: cloneSourceId === planBox.id ? '#fff' : 'rgba(255,255,255,0.2)',
                          color: cloneSourceId === planBox.id ? getCategoryColor(planBox.category) : '#fff',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        {cloneSourceId === planBox.id ? '복제중' : '복제'}
                      </button>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 플랜박스 상세 모달 */}
      {isModalOpen && currentPlanBox && (
        <div className="modal show" id="planboxModal">
          <div className="modal-content" style={{maxWidth: '550px', display: 'flex', flexDirection: 'column', padding: 0}}>
            {/* 모달 헤더 */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e0e0e0',
              background: 'linear-gradient(to bottom, #fff, #fafafa)'
            }}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', flex: 1}}>
                  {modalTitleEditing ? (
                    <input 
                      ref={modalTitleEditRef}
                      type="text" 
                      value={currentPlanBox.title}
                      onChange={(e) => setCurrentPlanBox({...currentPlanBox, title: e.target.value})}
                      onBlur={finishTitleEdit}
                      onKeyDown={handleTitleEditKey}
                      style={{
                        fontSize: '22px',
                        fontWeight: '600',
                        border: 'none',
                        borderBottom: '2px solid #1976D2',
                        outline: 'none',
                        flex: 1,
                        background: 'transparent'
                      }}
                    />
                  ) : (
                    <h2 
                      onClick={startTitleEdit}
                      style={{
                        fontSize: '22px',
                        fontWeight: '600',
                        color: '#212529',
                        cursor: 'text',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {currentPlanBox.title}
                    </h2>
                  )}
                  <button 
                    onClick={startTitleEdit}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span className="material-icons-outlined" style={{fontSize: '18px', color: '#999'}}>edit</span>
                  </button>
                </div>
                <button 
                  className="modal-close" 
                  onClick={hideModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    color: '#999',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'all 0.2s'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* 모달 바디 */}
            <div style={{padding: '20px 24px', background: '#fafafa'}}>
              {/* 장소 검색 섹션 */}
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <label style={{
                  fontSize: '13px',
                  color: '#495057',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  📍 장소 검색
                </label>
                <div style={{position: 'relative'}}>
                  <input
                    type="text"
                    placeholder="장소명을 검색하세요 (예: 도쿄 타워, 신주쿠 역)"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#868e96',
                    fontSize: '20px'
                  }}>
                    🔍
                  </span>
                  
                  {/* 검색 결과 */}
                  {searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      marginTop: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      {searchResults.map((place, index) => (
                        <div
                          key={index}
                          onClick={() => selectPlace(place)}
                          style={{
                            padding: '10px 12px',
                            borderBottom: index < searchResults.length - 1 ? '1px solid #f1f3f5' : 'none',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <div style={{fontSize: '14px', fontWeight: '500', color: '#212529'}}>
                            {place.place_name}
                          </div>
                          <div style={{fontSize: '12px', color: '#868e96', marginTop: '2px'}}>
                            {place.road_address_name || place.address_name}
                          </div>
                          {place.phone && (
                            <div style={{fontSize: '12px', color: '#868e96', marginTop: '2px'}}>
                              📞 {place.phone}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {isSearching && (
                    <div style={{
                      position: 'absolute',
                      right: '40px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#868e96',
                      fontSize: '12px'
                    }}>
                      검색 중...
                    </div>
                  )}
                </div>
              </div>
              
              {/* 시간 정보 */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px'}}>
                <div>
                  <label style={{fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px', fontWeight: '500'}}>
                    <span className="material-icons-outlined" style={{fontSize: '14px', verticalAlign: 'middle'}}>schedule</span>
                    시작 시간
                  </label>
                  <div style={{display: 'flex', gap: '4px'}}>
                    <select 
                      value={currentPlanBox.startHour !== null ? currentPlanBox.startHour : ''}
                      onChange={(e) => setCurrentPlanBox({...currentPlanBox, startHour: e.target.value ? parseInt(e.target.value) : null, hasTimeSet: true})}
                      style={{flex: 1, padding: '7px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
                    >
                      <option value="">시간 미설정</option>
                      {Array.from({length: 24}, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, '0')}시</option>
                      ))}
                    </select>
                    <select 
                      value={currentPlanBox.startMinute || 0}
                      onChange={(e) => setCurrentPlanBox({...currentPlanBox, startMinute: parseInt(e.target.value), hasTimeSet: true})}
                      style={{width: '80px', padding: '7px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
                    >
                      {[0, 10, 20, 30, 40, 50].map(minute => (
                        <option key={minute} value={minute}>{String(minute).padStart(2, '0')}분</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label style={{fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px', fontWeight: '500'}}>
                    <span className="material-icons-outlined" style={{fontSize: '14px', verticalAlign: 'middle'}}>timer</span>
                    소요 시간
                  </label>
                  <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
                    <input 
                      type="number"
                      min="0"
                      max="23"
                      value={currentPlanBox.durationHour}
                      onChange={(e) => setCurrentPlanBox({...currentPlanBox, durationHour: parseInt(e.target.value) || 0})}
                      style={{width: '60px', padding: '7px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
                    />
                    <span style={{color: '#999', fontSize: '12px'}}>시간</span>
                    <select 
                      value={currentPlanBox.durationMinute}
                      onChange={(e) => setCurrentPlanBox({...currentPlanBox, durationMinute: parseInt(e.target.value)})}
                      style={{width: '80px', padding: '7px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
                    >
                      {[0, 10, 20, 30, 40, 50].map(minute => (
                        <option key={minute} value={minute}>{minute}분</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* 종료 시간 표시 */}
              <div id="endTimeDisplay" style={{
                marginBottom: '18px', 
                padding: '8px', 
                background: '#e3f2fd', 
                borderRadius: '6px', 
                textAlign: 'center', 
                color: '#1976D2', 
                fontSize: '13px', 
                fontWeight: '500'
              }}>
                종료: {currentPlanBox.startHour !== null && currentPlanBox.startMinute !== null ? 
                  calculateEndTime(currentPlanBox.startHour, currentPlanBox.startMinute, currentPlanBox.durationHour, currentPlanBox.durationMinute) : 
                  '--:--'
                }
              </div>
              
              {/* 카테고리와 비용 */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px'}}>
                <div>
                  <label style={{fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px', fontWeight: '500'}}>
                    <span className="material-icons-outlined" style={{fontSize: '14px', verticalAlign: 'middle'}}>category</span>
                    카테고리
                  </label>
                  <select 
                    value={currentPlanBox.category}
                    onChange={(e) => setCurrentPlanBox({...currentPlanBox, category: e.target.value})}
                    style={{width: '100%', padding: '7px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
                  >
                    <option value="food">🍽️ 식사</option>
                    <option value="transport">🚌 이동</option>
                    <option value="activity">⚽ 활동</option>
                    <option value="sightseeing">📷 관광</option>
                    <option value="shopping">🛍️ 쇼핑</option>
                    <option value="accommodation">🏨 숙박</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px', fontWeight: '500'}}>
                    💰 예상 비용
                  </label>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <input 
                      type="number" 
                      value={currentPlanBox.cost.replace(/[^0-9]/g, '')}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        setCurrentPlanBox({...currentPlanBox, cost: value})
                      }}
                      placeholder="0"
                      style={{flex: 1, padding: '7px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
                    />
                    <select
                      value={selectedCurrency}
                      onChange={(e) => {
                        setSelectedCurrency(e.target.value)
                        // 환율 설정 (실제로는 API에서 가져와야 함)
                        const rates: {[key: string]: number} = {
                          'KRW': 1,
                          'JPY': 9.5,  // 100엔 = 950원
                          'USD': 1300, // 1달러 = 1300원
                          'EUR': 1400  // 1유로 = 1400원
                        }
                        setExchangeRate(rates[e.target.value] || 1)
                      }}
                      style={{width: '80px', padding: '7px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px'}}
                    >
                      <option value="KRW">원</option>
                      <option value="JPY">엔</option>
                      <option value="USD">달러</option>
                      <option value="EUR">유로</option>
                    </select>
                  </div>
                  {selectedCurrency !== 'KRW' && currentPlanBox.cost && (
                    <div style={{
                      marginTop: '4px',
                      fontSize: '11px',
                      color: '#868e96'
                    }}>
                      ≈ {(parseInt(currentPlanBox.cost) * exchangeRate).toLocaleString()}원
                    </div>
                  )}
                </div>
              </div>
              
              {/* 위치 */}
              <div style={{marginBottom: '18px'}}>
                <label style={{fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px', fontWeight: '500'}}>
                  <span className="material-icons-outlined" style={{fontSize: '14px', verticalAlign: 'middle'}}>location_on</span>
                  위치
                </label>
                <div style={{display: 'flex', gap: '8px'}}>
                  <input 
                    type="text"
                    value={currentPlanBox.location || ''}
                    onChange={(e) => setCurrentPlanBox({...currentPlanBox, location: e.target.value})}
                    placeholder="위치를 입력하세요"
                    style={{
                      flex: 1,
                      padding: '7px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={() => {
                      setIsMapModalOpen(true)
                      setSelectedLocation(currentPlanBox.location || '')
                    }}
                    style={{
                      padding: '7px 12px',
                      background: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span className="material-icons" style={{fontSize: '18px'}}>map</span>
                    지도
                  </button>
                </div>
              </div>
              
              {/* 메모 */}
              <div style={{marginBottom: '18px'}}>
                <label style={{fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px', fontWeight: '500'}}>
                  <span className="material-icons-outlined" style={{fontSize: '14px', verticalAlign: 'middle'}}>notes</span>
                  메모
                </label>
                <textarea 
                  value={currentPlanBox.memo}
                  onChange={(e) => setCurrentPlanBox({...currentPlanBox, memo: e.target.value})}
                  placeholder="자세한 정보나 메모를 입력하세요"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '11px',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
            
            {/* 모달 푸터 */}
            <div style={{
              padding: '14px 24px', 
              borderTop: '1px solid #e0e0e0', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: 'white'
            }}>
              {isEditing && (
                <button 
                  className="btn btn-danger"
                  id="deleteBtn"
                  onClick={() => deletePlanBox(currentPlanBox.id)}
                  style={{
                    padding: '7px 14px', 
                    background: '#f44336', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontSize: '13px', 
                    fontWeight: '500', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px'
                  }}
                >
                  <span className="material-icons" style={{fontSize: '16px'}}>delete_outline</span>
                  삭제
                </button>
              )}
              <div style={{flex: 1}}></div>
              <button 
                className="btn btn-secondary"
                onClick={hideModal}
                style={{
                  padding: '7px 14px', 
                  background: 'white', 
                  color: '#666', 
                  border: '1px solid #ddd', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  marginRight: '8px', 
                  fontSize: '13px', 
                  fontWeight: '500'
                }}
              >
                취소
              </button>
              <button 
                className="btn btn-primary"
                onClick={savePlanBox}
                style={{
                  padding: '7px 18px', 
                  background: '#1976D2', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  fontSize: '13px', 
                  fontWeight: '500', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px'
                }}
              >
                <span className="material-icons" style={{fontSize: '16px'}}>check</span>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 지도 모달 */}
      {isMapModalOpen && (
        <div className="modal show" style={{zIndex: 2000}}>
          <div className="modal-content" style={{maxWidth: '700px', width: '90%', maxHeight: '80vh', overflow: 'auto'}}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e0e0e0',
              background: 'linear-gradient(to bottom, #fff, #fafafa)'
            }}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <h2 style={{fontSize: '20px', fontWeight: '600', color: '#212529'}}>
                  <span className="material-icons" style={{fontSize: '24px', verticalAlign: 'middle', marginRight: '8px', color: '#2196F3'}}>map</span>
                  위치 선택
                </h2>
                <button 
                  onClick={() => setIsMapModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    color: '#999'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div style={{padding: '20px'}}>
              <div style={{
                background: '#f8f9fa',
                border: '2px dashed #dee2e6',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                color: '#6c757d'
              }}>
                <span className="material-icons" style={{fontSize: '48px', color: '#dee2e6', marginBottom: '16px', display: 'block'}}>map</span>
                <p style={{fontSize: '16px', marginBottom: '8px'}}>지도 API 연동 준비 중</p>
                <p style={{fontSize: '14px', color: '#adb5bd'}}>Kakao Maps 또는 Google Maps API를 통해 위치를 선택할 수 있습니다</p>
              </div>
              
              <div style={{marginTop: '20px'}}>
                <input 
                  type="text"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  placeholder="직접 위치를 입력하세요"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            <div className="modal-buttons" style={{padding: '16px 24px', borderTop: '1px solid #e0e0e0'}}>
              <button 
                className="btn-secondary" 
                onClick={() => setIsMapModalOpen(false)}
              >
                취소
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  if (currentPlanBox) {
                    setCurrentPlanBox({...currentPlanBox, location: selectedLocation})
                  }
                  setIsMapModalOpen(false)
                }}
              >
                선택
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 시간 설정 모달 */}
      {isTimeSettingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">
              Day {currentSettingDay + 1} 시간 범위 설정
            </h2>
            
            {/* 프리셋 버튼들 */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">빠른 설정</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setTimePreset(currentSettingDay, '새벽')
                    setIsTimeSettingModalOpen(false)
                  }}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                >
                  새벽 (0-6)
                </button>
                <button
                  onClick={() => {
                    setTimePreset(currentSettingDay, '오전')
                    setIsTimeSettingModalOpen(false)
                  }}
                  className="px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                >
                  오전 (6-12)
                </button>
                <button
                  onClick={() => {
                    setTimePreset(currentSettingDay, '오후')
                    setIsTimeSettingModalOpen(false)
                  }}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  오후 (12-18)
                </button>
                <button
                  onClick={() => {
                    setTimePreset(currentSettingDay, '저녁')
                    setIsTimeSettingModalOpen(false)
                  }}
                  className="px-3 py-2 bg-pink-100 text-pink-700 rounded hover:bg-pink-200"
                >
                  저녁 (18-24)
                </button>
                <button
                  onClick={() => {
                    setTimePreset(currentSettingDay, '표준')
                    setIsTimeSettingModalOpen(false)
                  }}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  표준 (7-23)
                </button>
                <button
                  onClick={() => {
                    setCustomTimeRange(currentSettingDay, 0, 24)
                    setIsTimeSettingModalOpen(false)
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  전체 (0-24)
                </button>
              </div>
            </div>
            
            {/* 커스텀 시간 입력 */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">커스텀 설정</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  defaultValue={dayTimeRanges[currentSettingDay]?.start || DEFAULT_TIME_RANGE.start}
                  className="w-20 px-2 py-1 border rounded"
                  id="customStartTime"
                />
                <span>시부터</span>
                <input
                  type="number"
                  min="1"
                  max="24"
                  defaultValue={dayTimeRanges[currentSettingDay]?.end || DEFAULT_TIME_RANGE.end}
                  className="w-20 px-2 py-1 border rounded"
                  id="customEndTime"
                />
                <span>시까지</span>
              </div>
            </div>
            
            {/* 버튼들 */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsTimeSettingModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={() => {
                  const startInput = document.getElementById('customStartTime') as HTMLInputElement
                  const endInput = document.getElementById('customEndTime') as HTMLInputElement
                  const start = parseInt(startInput.value)
                  const end = parseInt(endInput.value)
                  
                  if (setCustomTimeRange(currentSettingDay, start, end)) {
                    setIsTimeSettingModalOpen(false)
                  } else {
                    alert('올바른 시간 범위를 입력해주세요 (시작 시간 < 종료 시간)')
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}