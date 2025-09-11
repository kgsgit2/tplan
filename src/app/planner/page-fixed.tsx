'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

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
  const [timeRangeStart] = useState(7)  
  const [timeRangeEnd] = useState(23)
  const [dayTimeRanges, setDayTimeRanges] = useState<{[key: number]: TimeRange}>({})
  
  // 드래그앤드롭 상태
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null)
  const [draggedData, setDraggedData] = useState<PlanBox | null>(null)
  const [isFirstDrop, setIsFirstDrop] = useState(true)
  const [originalTimeDisplay, setOriginalTimeDisplay] = useState<string | null>(null)
  const [isDraggingFromTimeline, setIsDraggingFromTimeline] = useState(false)

  // 리사이징 상태
  const [resizingBox, setResizingBox] = useState<PlanBox | null>(null)
  const [resizeStartY, setResizeStartY] = useState<number>(0)
  const [resizeOriginalHeight, setResizeOriginalHeight] = useState<number>(0)
  const [resizeDirection, setResizeDirection] = useState<'top' | 'bottom' | null>(null)
  const [resizeOriginalTop, setResizeOriginalTop] = useState<number>(0)
  
  // 시간배지 상태
  const [timeBadge, setTimeBadge] = useState<{x: number, y: number, text: string} | null>(null)
  const [ghostBox, setGhostBox] = useState<{dayIndex: number, hour: number, minute: number, height: number} | null>(null)
  
  // 무한 복제 모드 상태
  const [cloneSourceId, setCloneSourceId] = useState<number | null>(null)
  const [isCloneMode, setIsCloneMode] = useState(false)

  // 충돌 알림 상태
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)

  // 뷰 모드 상태
  const [viewMode, setViewMode] = useState<'edit' | 'compress' | 'print'>('edit')

  // 점유된 슬롯 표시
  const [occupiedSlots, setOccupiedSlots] = useState<{[key: string]: boolean}>({})

  // Refs
  const modalTitleEditRef = useRef<HTMLInputElement>(null)
  const dragImageRef = useRef<HTMLCanvasElement>(null)

  // 디버깅용 - placedBoxes 상태 모니터링
  useEffect(() => {
    console.log('📦 PlacedBoxes updated:', placedBoxes)
    updateOccupiedSlots()
  }, [placedBoxes])

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

  // 자동저장 - planboxData나 placedBoxes가 변경될 때마다 저장
  useEffect(() => {
    if (planboxData.length > 0 || placedBoxes.length > 0) {
      console.log('💾 Auto-saving to localStorage')
      saveToStorage()
    }
  }, [planboxData, placedBoxes])

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
    setDraggedData(planBox)
    setIsDraggingFromTimeline(isFromTimeline)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', planBox.id.toString())
    
    // 투명한 드래그 이미지 설정
    createTransparentDragImage(e)
    
    // 드래그 중인 요소 스타일링
    const element = e.currentTarget as HTMLElement
    setDraggedElement(element)
    element.style.opacity = '0.5'
    element.style.transform = 'scale(0.95)'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('✅ Drag ended')
    const element = e.currentTarget as HTMLElement
    element.style.opacity = '1'
    element.style.transform = 'scale(1)'
    setDraggedElement(null)
    setDraggedData(null)
    setTimeBadge(null)
    setGhostBox(null)
    setIsDraggingFromTimeline(false)
  }

  const handleSlotDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    const slot = e.currentTarget as HTMLElement
    slot.classList.add('drag-over')
    
    // 드래그 중인 위치 계산 및 시간배지 표시
    if (draggedData) {
      const dayIndex = parseInt(slot.dataset.day || '0')
      const hour = parseInt(slot.dataset.hour || '0')
      const rect = slot.getBoundingClientRect()
      const y = e.clientY - rect.top
      const minuteOffset = Math.floor((y / rect.height) * 60)
      const minute = Math.round(minuteOffset / 10) * 10 // 10분 단위로 스냅
      
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
      
      // 고스트 박스 표시
      setGhostBox({
        dayIndex,
        hour,
        minute,
        height: draggedData.durationHour * 60 + draggedData.durationMinute
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
    const slot = e.currentTarget as HTMLElement
    slot.classList.remove('drag-over')
    
    // 시간배지와 고스트 박스 제거
    setTimeBadge(null)
    setGhostBox(null)
    
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
    const minute = Math.round(minuteOffset / 10) * 10 // 10분 단위로 반올림 스냅
    
    console.log(`📍 Dropped at Day ${dayIndex + 1}, ${hour}:${minute.toString().padStart(2, '0')}`)
    
    // 플랜박스를 타임라인에 배치
    const durationInMinutes = draggedData.durationHour * 60 + draggedData.durationMinute
    const snappedDuration = Math.round(durationInMinutes / 10) * 10
    
    let placedBox: PlanBox = {
      ...draggedData,
      startHour: hour,
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

  // 카테고리별 그라데이션 색상 반환
  const getCategoryGradient = (category: string): string => {
    switch (category) {
      case 'food':
        return 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
      case 'transport':
        return 'linear-gradient(135deg, #4CAF50 0%, #45A049 100%)'
      case 'activity':
        return 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
      case 'sightseeing':
        return 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
      case 'shopping':
        return 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)'
      case 'accommodation':
        return 'linear-gradient(135deg, #673AB7 0%, #512DA8 100%)'
      default:
        return 'linear-gradient(135deg, #9E9E9E 0%, #757575 100%)'
    }
  }

  // 카테고리별 단색 반환
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'food':
        return '#FF9800'
      case 'transport':
        return '#4CAF50'
      case 'activity':
        return '#2196F3'
      case 'sightseeing':
        return '#9C27B0'
      case 'shopping':
        return '#E91E63'
      case 'accommodation':
        return '#673AB7'
      default:
        return '#9E9E9E'
    }
  }

  // 리사이징 핸들러를 useEffect로 관리
  useEffect(() => {
    if (!resizingBox) return

    const handleResizeMove = (e: MouseEvent) => {
      if (!resizingBox || !resizeDirection) return
      
      const deltaY = e.clientY - resizeStartY
      
      if (resizeDirection === 'bottom') {
        // 하단 리사이즈
        const newHeight = Math.max(30, resizeOriginalHeight + deltaY)
        const newDurationMinutes = Math.round(newHeight / 10) * 10
        
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
      } else if (resizeDirection === 'top') {
        // 상단 리사이즈
        const deltaMinutes = Math.round(deltaY / 10) * 10 // 10분 단위 스냅
        const newStartMinute = Math.max(0, Math.min(50, resizeOriginalTop + deltaMinutes))
        const heightDiff = newStartMinute - resizeOriginalTop
        const newHeight = Math.max(30, resizeOriginalHeight - heightDiff)
        
        // 새로운 시작 시간 계산
        const totalStartMinutes = resizingBox.startHour! * 60 + newStartMinute
        const newStartHour = Math.floor(totalStartMinutes / 60)
        const finalStartMinute = totalStartMinutes % 60
        
        // 시간배지 표시
        const startTimeText = formatTime(newStartHour, finalStartMinute)
        const endTotalMinutes = totalStartMinutes + newHeight
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
              startMinute: finalStartMinute,
              top: finalStartMinute,
              height: newHeight,
              durationHour: Math.floor(newHeight / 60),
              durationMinute: newHeight % 60
            } : box
        ))
      }
    }

    const handleResizeEnd = () => {
      setResizingBox(null)
      setResizeStartY(0)
      setResizeOriginalHeight(0)
      setResizeDirection(null)
      setResizeOriginalTop(0)
      setTimeBadge(null)
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

  // 나머지 helper 함수들...
  const formatTime = (hour: number | null, minute: number | null) => {
    if (hour === null || hour === undefined) return '미설정'
    const h = String(hour).padStart(2, '0')
    const m = String(minute || 0).padStart(2, '0')
    return `${h}:${m}`
  }

  const formatDuration = (hour: number, minute: number) => {
    if (hour === 0) return `${minute}분`
    if (minute === 0) return `${hour}시간`
    return `${hour}시간 ${minute}분`
  }

  // localStorage 저장 함수
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
      localStorage.setItem('tplan-data', JSON.stringify(dataToSave))
      console.log('데이터 자동저장 완료:', dataToSave.lastSaved)
    } catch (error) {
      console.error('데이터 저장 실패:', error)
    }
  }

  // localStorage 불러오기 함수
  const loadFromStorage = () => {
    try {
      const savedData = localStorage.getItem('tplan-data')
      if (savedData) {
        const data = JSON.parse(savedData)
        
        // 저장된 데이터 복원
        setPlanboxData(data.planboxData || [])
        setPlacedBoxes(data.placedBoxes || [])
        setTripTitle(data.tripTitle || '도쿄 여행')
        setStartDate(data.startDate || '2025-01-15')
        setEndDate(data.endDate || '2025-01-21')
        setTotalDays(data.totalDays || 7)
        setDayTimeRanges(data.dayTimeRanges || {})
        
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

  // 프로토타입 완전 동일한 초기 데이터
  useEffect(() => {
    loadFromStorage()
    updateTimeline()
  }, [])

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
    const range = dayTimeRanges[dayIndex] || { start: timeRangeStart, end: timeRangeEnd }
    const slots = []
    for (let hour = range.start; hour < range.end; hour++) {
      slots.push(hour)
    }
    return slots
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

    const defaults = categoryDefaults[category]
    const newBox: PlanBox = {
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

    setPlanboxData(prev => [...prev, newBox])
  }

  // 비용 계산
  const calculateTotalCost = () => {
    let total = 0
    const costs: {[key: string]: number} = {}
    
    placedBoxes.forEach(box => {
      let cost = 0
      if (box.cost) {
        const costStr = box.cost.toLowerCase()
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
      top: newStartMinute
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

  // 나머지 함수들은 원본과 동일...

  return (
    <div className={`planner-container ${viewMode}`}>
      {/* 충돌 알림 메시지 */}
      {conflictMessage && (
        <div className="conflict-alert" style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ff5722',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          zIndex: 9999,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          {conflictMessage}
        </div>
      )}

      {/* 시간 배지 */}
      {timeBadge && (
        <div className="time-badge" style={{
          position: 'fixed',
          left: timeBadge.x + 'px',
          top: timeBadge.y + 'px',
          background: '#333',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          zIndex: 10000,
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          {timeBadge.text}
        </div>
      )}

      {/* 헤더 */}
      <div className="header">
        <div className="header-left">
          <h1 className="header-title">TPlan</h1>
          
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'edit' ? 'active' : ''}`}
              onClick={() => setViewMode('edit')}
            >
              편집
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'compress' ? 'active' : ''}`}
              onClick={() => setViewMode('compress')}
            >
              압축
            </button>
            <button
              className="view-mode-btn"
              onClick={handlePrint}
            >
              인쇄
            </button>
          </div>
        </div>

        <div className="header-controls">
          <input 
            type="text" 
            id="tripTitle"
            placeholder="여행 제목"
            value={tripTitle}
            onChange={(e) => setTripTitle(e.target.value)}
          />
          <input 
            type="date"
            id="startDate" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{color: '#868e96'}}>~</span>
          <input 
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button className="btn-header" onClick={updateTimeline}>적용</button>
          <button className="btn-reset" onClick={resetAllData}>초기화</button>
        </div>
      </div>
      
      {/* 메인 레이아웃 */}
      <div className="main-layout">
        {/* 사이드바 */}
        <div 
          className="sidebar"
          onDragOver={handleSidebarDragOver}
          onDrop={handleSidebarDrop}
        >
          <div className="sidebar-section">
            <h3>플랜박스</h3>
            
            {/* 카테고리 필터 */}
            <div className="category-filter">
              <div 
                className={`category-item ${categoryFilter === 'all' ? 'active' : ''}`}
                data-category="all"
                onClick={() => setCategoryFilter('all')}
              >
                전체
              </div>
              <div 
                className={`category-item ${categoryFilter === 'food' ? 'active' : ''}`}
                data-category="food"
                onClick={() => setCategoryFilter('food')}
              >
                식사
              </div>
              <div 
                className={`category-item ${categoryFilter === 'transport' ? 'active' : ''}`}
                data-category="transport"
                onClick={() => setCategoryFilter('transport')}
              >
                이동
              </div>
              <div 
                className={`category-item ${categoryFilter === 'activity' ? 'active' : ''}`}
                data-category="activity"
                onClick={() => setCategoryFilter('activity')}
              >
                활동
              </div>
              <div 
                className={`category-item ${categoryFilter === 'sightseeing' ? 'active' : ''}`}
                data-category="sightseeing"
                onClick={() => setCategoryFilter('sightseeing')}
              >
                관광
              </div>
              <div 
                className={`category-item ${categoryFilter === 'shopping' ? 'active' : ''}`}
                data-category="shopping"
                onClick={() => setCategoryFilter('shopping')}
              >
                쇼핑
              </div>
              <div 
                className={`category-item ${categoryFilter === 'accommodation' ? 'active' : ''}`}
                data-category="accommodation"
                onClick={() => setCategoryFilter('accommodation')}
              >
                숙박
              </div>
            </div>

            {/* 플랜박스 목록 */}
            <div className="planbox-list" id="planboxList">
              {planboxData
                .filter(box => categoryFilter === 'all' || box.category === categoryFilter)
                .map(box => (
                  <div
                    key={box.id}
                    className={`planbox-item ${box.category} ${cloneSourceId === box.id ? 'cloneable' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, box, false)}
                    onDragEnd={handleDragEnd}
                    onDoubleClick={() => editPlanBox(box)}
                    style={{
                      background: getCategoryGradient(box.category),
                      position: 'relative'
                    }}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px'}}>
                      <span style={{fontSize: '12px', color: '#fff'}}>
                        {box.hasTimeSet && box.startHour !== null ? 
                          formatTime(box.startHour, box.startMinute) : 
                          '시간 미설정'}
                      </span>
                      <div style={{flex: 1, fontSize: '13px', fontWeight: '600', color: '#fff'}}>
                        {box.title}
                      </div>
                    </div>
                    <div style={{fontSize: '10px', color: 'rgba(255,255,255,0.9)'}}>
                      {formatDuration(box.durationHour, box.durationMinute)}
                    </div>
                    {box.memo && (
                      <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '2px'}}>
                        📝 {box.memo}
                      </div>
                    )}
                    {box.cost && (
                      <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.9)', marginTop: '2px'}}>
                        💰 {box.cost}
                      </div>
                    )}
                    
                    {/* 복제 버튼 */}
                    <button
                      className={`clone-btn ${cloneSourceId === box.id ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCloneMode(box.id)
                      }}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: cloneSourceId === box.id ? '#fff' : 'rgba(255,255,255,0.2)',
                        color: cloneSourceId === box.id ? getCategoryColor(box.category) : '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      {cloneSourceId === box.id ? '복제중' : '복제'}
                    </button>
                  </div>
                ))}
            </div>

            {/* 빠른 생성 버튼들 */}
            <div className="quick-create">
              <button onClick={() => createQuickBox('food')} style={{background: '#FF9800'}}>
                🍽️ 식사
              </button>
              <button onClick={() => createQuickBox('transport')} style={{background: '#4CAF50'}}>
                🚌 이동
              </button>
              <button onClick={() => createQuickBox('activity')} style={{background: '#2196F3'}}>
                🎯 활동
              </button>
              <button onClick={() => createQuickBox('sightseeing')} style={{background: '#9C27B0'}}>
                🏛️ 관광
              </button>
              <button onClick={() => createQuickBox('shopping')} style={{background: '#E91E63'}}>
                🛍️ 쇼핑
              </button>
              <button onClick={() => createQuickBox('accommodation')} style={{background: '#673AB7'}}>
                🏨 숙박
              </button>
            </div>

            {/* 새 플랜 추가 버튼 */}
            <button className="btn-add-plan" onClick={showAddModal}>
              + 새 플랜 추가
            </button>
          </div>
        </div>

        {/* 타임라인 영역 */}
        <div className="timeline-area">
          <div className="timeline-container">
            {/* 시간 라벨 - ADAPTIVE에서는 숨김 */}
            <div className="time-labels" id="timeLabels"></div>
            
            {/* 날짜 컬럼들 */}
            <div className="day-columns" id="dayColumns">
              {Array.from({length: totalDays}, (_, dayIndex) => (
                <div key={dayIndex} className="flex">
                  {/* 개별 타임바 */}
                  <div className="day-timebar">
                    <div className="time-range-header">
                      <div className="time-preset-buttons">
                        <button className="preset-btn">표준</button>
                        <button className="preset-btn">설정</button>
                      </div>
                    </div>
                    
                    {/* 개별 시간 라벨 */}
                    {(viewMode === 'compress' ? getUsedTimeSlots(dayIndex) : generateTimeSlots(dayIndex)).map(hour => (
                      <div key={hour} className="time-label">
                        {hour}:00
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
                          className={`time-slot ${occupiedSlots[`${dayIndex}-${hour}-0`] ? 'occupied' : ''}`}
                          data-day={dayIndex}
                          data-hour={hour}
                          onDragOver={handleSlotDragOver}
                          onDragLeave={handleSlotDragLeave}
                          onDrop={handleSlotDrop}
                        >
                          {/* 10분 단위 서브 슬롯 */}
                          <div className="sub-slots">
                            {[10, 20, 30, 40, 50].map(minute => (
                              <div 
                                key={minute}
                                className={`sub-slot ${occupiedSlots[`${dayIndex}-${hour}-${minute}`] ? 'occupied' : ''}`}
                                data-minute={minute}
                              />
                            ))}
                          </div>
                          
                          {/* 고스트 박스 표시 */}
                          {ghostBox && ghostBox.dayIndex === dayIndex && ghostBox.hour === hour && (
                            <div
                              className="ghost-box"
                              style={{
                                position: 'absolute',
                                top: `${ghostBox.minute}px`,
                                left: '0',
                                right: '0',
                                height: `${ghostBox.height}px`,
                                background: 'rgba(102, 126, 234, 0.1)',
                                border: '2px dashed #667eea',
                                borderRadius: '0',
                                pointerEvents: 'none',
                                zIndex: 5,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                color: '#667eea',
                                fontWeight: '600',
                                gap: '4px'
                              }}
                            >
                              <div>{draggedData?.title}</div>
                              <div style={{fontSize: '10px'}}>
                                {formatDuration(Math.floor(ghostBox.height / 60), ghostBox.height % 60)}
                              </div>
                            </div>
                          )}
                          
                          {/* 배치된 플랜박스들 렌더링 */}
                          {placedBoxes
                            .filter(box => box.dayIndex === dayIndex && box.startHour === hour)
                            .map(box => (
                              <div
                                key={`placed-${box.id}-${box.dayIndex}-${box.startHour}`}
                                className={`placed-box ${box.category}`}
                                draggable={!resizingBox}
                                onDragStart={(e) => handleDragStart(e, box, true)}
                                onDragEnd={handleDragEnd}
                                onMouseMove={(e) => {
                                  if (!resizingBox) {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const y = e.clientY - rect.top
                                    
                                    if (y <= 10 || y >= rect.height - 10) {
                                      e.currentTarget.style.cursor = 'ns-resize'
                                    } else {
                                      e.currentTarget.style.cursor = 'move'
                                    }
                                  }
                                }}
                                onMouseDown={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  const y = e.clientY - rect.top
                                  
                                  if (y <= 10) {
                                    // 상단 리사이즈
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log('🔄 Top resize started for:', box.title)
                                    setResizingBox(box)
                                    setResizeDirection('top')
                                    setResizeStartY(e.clientY)
                                    setResizeOriginalHeight(box.height || 60)
                                    setResizeOriginalTop(box.startMinute || 0)
                                  } else if (y >= rect.height - 10) {
                                    // 하단 리사이즈
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log('🔄 Bottom resize started for:', box.title)
                                    setResizingBox(box)
                                    setResizeDirection('bottom')
                                    setResizeStartY(e.clientY)
                                    setResizeOriginalHeight(box.height || 60)
                                  }
                                }}
                                style={{
                                  position: 'absolute',
                                  top: `${box.startMinute || 0}px`,
                                  left: '0',
                                  right: '0',
                                  height: `${box.height || 60}px`,
                                  background: '#fff',
                                  border: '1px solid #e9ecef',
                                  borderLeft: `4px solid ${getCategoryColor(box.category)}`,
                                  borderRadius: '0',
                                  padding: '4px',
                                  fontSize: '11px',
                                  color: '#000',
                                  zIndex: 10,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                  cursor: resizingBox ? 'ns-resize' : 'move',
                                  overflow: 'hidden',
                                  minHeight: '30px'
                                }}
                                onDoubleClick={() => editPlanBox(box)}
                              >
                                <div style={{padding: '2px'}}>
                                  <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    <span style={{fontSize: '12px', fontWeight: '700'}}>
                                      {formatTime(box.startHour, box.startMinute)}
                                    </span>
                                    <div style={{flex: 1, fontSize: '11px', fontWeight: '600'}}>
                                      {box.title}
                                    </div>
                                  </div>
                                  {box.height && box.height >= 40 && (
                                    <div style={{fontSize: '9px', color: '#666', marginTop: '2px'}}>
                                      {formatDuration(box.durationHour, box.durationMinute)}
                                    </div>
                                  )}
                                  {box.memo && box.height && box.height >= 60 && (
                                    <div style={{fontSize: '10px', color: '#555', marginTop: '2px'}}>
                                      📝 {box.memo}
                                    </div>
                                  )}
                                  {box.cost && box.height && box.height >= 80 && (
                                    <div style={{fontSize: '10px', color: '#2E7D32', marginTop: '2px'}}>
                                      💰 {box.cost}
                                    </div>
                                  )}
                                </div>
                                
                                {/* 리사이즈 핸들 표시 */}
                                <div 
                                  className="resize-handle-top"
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '10px',
                                    cursor: 'ns-resize',
                                    background: 'transparent'
                                  }}
                                />
                                <div 
                                  className="resize-handle-bottom"
                                  style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '10px',
                                    cursor: 'ns-resize',
                                    background: 'transparent'
                                  }}
                                />
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 모달들은 원본과 동일하게 구현... */}
    </div>
  )
}

// Helper 함수들
function editPlanBox(planBox: PlanBox) {
  console.log('Edit planbox:', planBox)
}

function showAddModal() {
  console.log('Show add modal')
}

function toggleCloneMode(id: number) {
  console.log('Toggle clone mode for:', id)
}