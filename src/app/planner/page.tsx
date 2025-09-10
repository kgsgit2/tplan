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

  // Refs
  const modalTitleEditRef = useRef<HTMLInputElement>(null)

  // 디버깅용 - placedBoxes 상태 모니터링
  useEffect(() => {
    console.log('📦 PlacedBoxes updated:', placedBoxes)
  }, [placedBoxes])

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

  // 드래그앤드롭 이벤트 핸들러들
  const handleDragStart = (e: React.DragEvent, planBox: PlanBox) => {
    console.log('🚀 Drag started:', planBox.title, planBox.id)
    setDraggedData(planBox)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', planBox.id.toString())
    
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
    
    const isFromTimeline = e.dataTransfer.getData('isFromTimeline') === 'true'
    const dayIndex = parseInt(slot.dataset.day || '0')
    const hour = parseInt(slot.dataset.hour || '0')
    console.log('📊 Drop target:', { dayIndex, hour, isFromTimeline })
    
    // 드롭 위치 계산 (10분 단위로 정확히 스냅)
    const rect = slot.getBoundingClientRect()
    const y = e.clientY - rect.top
    const slotHeight = rect.height // 60px
    const minuteOffset = Math.floor((y / slotHeight) * 60)
    const minute = Math.round(minuteOffset / 10) * 10 // 10분 단위로 반올림 스냅
    
    console.log(`📍 Dropped at Day ${dayIndex + 1}, ${hour}:${minute.toString().padStart(2, '0')}`)
    
    // 플랜박스를 타임라인에 배치 (높이는 1픽셀 = 1분 기준)
    const durationInMinutes = draggedData.durationHour * 60 + draggedData.durationMinute
    const snappedDuration = Math.round(durationInMinutes / 10) * 10 // 10분 단위로 스냅
    let placedBox: PlanBox = {
      ...draggedData,
      startHour: hour,
      startMinute: minute,
      hasTimeSet: true,
      dayIndex: dayIndex,
      top: minute, // 시간 슬롯 내 분 오프셋
      height: snappedDuration // 10분 단위로 스냅된 높이
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
    if (isFromTimeline) {
      // 타임라인에서 이동한 경우: 기존 박스 업데이트
      setPlacedBoxes(prev => {
        const filtered = prev.filter(box => box.id !== draggedData.id)
        const newBoxes = [...filtered, placedBox]
        console.log('🔄 Moved box in timeline:', newBoxes)
        return newBoxes
      })
    } else {
      // 사이드바에서 추가한 경우
      setPlacedBoxes(prev => {
        const newBoxes = [...prev, placedBox]
        console.log('🔄 Added new box to timeline:', newBoxes)
        return newBoxes
      })
    }
    
    // 사이드바에서 제거 (필요에 따라)
    // setPlanboxData(prev => prev.filter(box => box.id !== draggedData.id))
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

  // 리사이징 이벤트 핸들러들
  const handleResizeStart = (e: React.MouseEvent, box: PlanBox) => {
    e.stopPropagation() // 박스 클릭 이벤트 방지
    setResizingBox(box)
    setResizeStartY(e.clientY)
    setResizeOriginalHeight(box.height || 60)
    
    // 마우스 이벤트 리스너 추가
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  }

  // 리사이즈 핸들러를 useEffect로 관리해서 상태 참조 문제 해결
  useEffect(() => {
    if (!resizingBox) return

    const handleResizeMove = (e: MouseEvent) => {
      if (!resizingBox || !resizeDirection) return
      
      const deltaY = e.clientY - resizeStartY
      
      if (resizeDirection === 'bottom') {
        // 하단 리사이즈 - 10분 단위로 스냅
        const newHeight = Math.max(30, resizeOriginalHeight + deltaY)
        const newDurationMinutes = Math.round(newHeight / 10) * 10 // 10분 단위로 스냅
        
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
        // 상단 리사이즈 - 10분 단위로 스냅
        const newTop = resizeOriginalTop + deltaY
        const newHeight = resizeOriginalHeight - deltaY
        
        if (newHeight >= 30 && newTop >= 0) {
          const snappedTop = Math.round(newTop / 10) * 10 // 10분 단위 스냅
          const snappedHeight = Math.round(newHeight / 10) * 10
          const totalMinutes = resizingBox.startHour! * 60 + snappedTop
          const newStartHour = Math.floor(totalMinutes / 60)
          const newStartMinute = totalMinutes % 60
          const newDurationMinutes = Math.max(30, snappedHeight)
          
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
          <span style={{color: '#667eea', fontWeight: 'bold', marginLeft: '10px'}}>v10.0 ADAPTIVE</span>
          <button 
            onClick={() => setViewMode(viewMode === 'compress' ? 'edit' : 'compress')}
            style={{
              background: viewMode === 'compress' ? '#7B1FA2' : '#9C27B0', 
              color: 'white', 
              padding: '5px 10px', 
              marginLeft: '10px', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span className="material-icons" style={{fontSize: '16px', verticalAlign: 'middle'}}>compress</span>
            {viewMode === 'compress' ? '편집 모드' : '압축 모드'}
          </button>
          <button 
            onClick={() => {
              // 압축 테스트: 모든 빈 시간 슬롯 숨기기 테스트
              const testCompressData = () => {
                console.log('압축 테스트 실행')
                console.log('사용된 시간대:', placedBoxes.map(box => ({
                  day: box.dayIndex,
                  hour: box.startHour,
                  duration: box.durationHour + 'h ' + box.durationMinute + 'm'
                })))
              }
              testCompressData()
              alert('압축 테스트 완료! 콘솔을 확인하세요.')
            }}
            style={{
              background: '#FF9800', 
              color: 'white', 
              padding: '5px 10px', 
              marginLeft: '10px', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer'
            }}
          >
            압축 테스트
          </button>
          <button 
            onClick={() => {
              if (confirm('모든 데이터를 초기화하시겠습니까? (저장된 데이터가 모두 삭제됩니다)')) {
                resetAllData()
              }
            }}
            style={{
              background: 'blue', 
              color: 'white', 
              padding: '5px 10px', 
              marginLeft: '10px', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer'
            }}
          >
            초기화
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
        <div className="view-mode-toggle" style={{
          display: 'flex',
          gap: '0',
          background: '#f8f9fa',
          padding: '2px',
          borderRadius: '8px',
          border: '2px solid #e9ecef'
        }}>
          <button
            className={`view-mode-btn ${viewMode === 'edit' ? 'active' : ''}`}
            onClick={() => setViewMode('edit')}
            style={{
              background: viewMode === 'edit' ? '#667eea' : 'transparent',
              color: viewMode === 'edit' ? '#fff' : '#868e96',
              border: 'none',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '6px'
            }}
          >
            편집
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'compress' ? 'active' : ''}`}
            onClick={() => setViewMode('compress')}
            style={{
              background: viewMode === 'compress' ? '#667eea' : 'transparent',
              color: viewMode === 'compress' ? '#fff' : '#868e96',
              border: 'none',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '6px'
            }}
          >
            압축
          </button>
          <button
            className="view-mode-btn"
            onClick={handlePrint}
            style={{
              background: 'transparent',
              color: '#868e96',
              border: 'none',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '6px'
            }}
          >
            인쇄
          </button>
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
          <button className="btn-print" onClick={handlePrint}>인쇄</button>
        </div>
      </div>
      
      {/* 메인 레이아웃 */}
      <div className="main-layout">
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
                  <div className="day-timebar" style={{
                    width: '25px',
                    background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRight: '1px solid #dee2e6',
                    position: 'relative'
                  }}>
                    <div className="time-range-header" style={{
                      padding: '2px',
                      borderBottom: '1px solid #dee2e6',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div className="time-preset-buttons" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <button className="preset-btn" style={{
                          fontSize: '8px',
                          padding: '1px',
                          width: '20px',
                          height: '12px',
                          background: '#1976D2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}>표준</button>
                        <button className="preset-btn" style={{
                          fontSize: '8px',
                          padding: '1px',
                          width: '20px',
                          height: '12px',
                          background: '#fff',
                          color: '#666',
                          border: '1px solid #ddd',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}>설정</button>
                      </div>
                    </div>
                    
                    {/* 개별 시간 라벨 */}
                    {(viewMode === 'compress' ? getUsedTimeSlots(dayIndex) : generateTimeSlots(dayIndex)).map(hour => (
                      <div key={hour} className="time-label" style={{
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        color: '#666',
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
                          
                          {/* 고스트 박스 표시 */}
                          {ghostBox && ghostBox.dayIndex === dayIndex && ghostBox.hour === hour && (
                            <div
                              style={{
                                position: 'absolute',
                                top: `${Math.round(ghostBox.minute / 10) * 10}px`,
                                left: '0',
                                right: '0',
                                height: `${Math.round(ghostBox.height / 10) * 10}px`,
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
                              <div style={{fontSize: '10px'}}>{formatDuration(Math.floor(ghostBox.height / 60), ghostBox.height % 60)}</div>
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
                            .map(box => (
                              <div
                                key={`placed-${box.id}-${box.dayIndex}-${box.startHour}`}
                                className={`placed-box ${box.category}`}
                                draggable={!resizingBox}
                                onDragStart={(e) => {
                                  handleDragStart(e, box)
                                  e.dataTransfer.setData('isFromTimeline', 'true')
                                }}
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
                                  top: `${Math.round((box.startMinute || 0) / 10) * 10}px`, // 10분 단위 스냅
                                  left: '0',
                                  right: '0',
                                  height: `${Math.round((box.height || 60) / 10) * 10}px`, // 10분 단위 높이
                                  background: '#fff',
                                  border: '1px solid #e9ecef',
                                  borderLeft: `4px solid ${getCategoryColor(box.category)}`,
                                  borderRadius: '0', // 각진 모서리
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
                              </div>
                            ))
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 플랜박스 영역 */}
        <div className="planbox-area">
          {/* 플랜박스 생성 영역 */}
          <div 
            className="creation-zone" 
            style={{
              background: 'linear-gradient(to bottom, #FAFBFC 0%, #F7F8FA 100%)', 
              padding: '10px 12px', 
              borderBottom: '1px solid #E5E8EB'
            }}
          >
            {/* 카테고리 빠른 생성 버튼 */}
            <div 
              className="quick-category-buttons" 
              style={{
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '6px', 
                marginBottom: '8px'
              }}
            >
              <button 
                className="quick-btn cat-transport" 
                onClick={createTransportBox}
                style={{
                  padding: '10px 8px',
                  border: 'none',
                  borderRadius: '12px',
                  background: '#4CAF50',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 3px rgba(0,208,132,0.3)'
                }}
              >
                <span className="material-icons-outlined" style={{fontSize: '18px'}}>directions</span>
                이동
              </button>
              
              <button 
                className="quick-btn cat-activity" 
                onClick={() => createQuickBox('activity')}
                style={{
                  padding: '10px 8px',
                  border: 'none',
                  borderRadius: '12px',
                  background: '#2196F3',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
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
                  padding: '10px 8px',
                  border: 'none',
                  borderRadius: '12px',
                  background: '#9C27B0',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
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
                  padding: '10px 8px',
                  border: 'none',
                  borderRadius: '12px',
                  background: '#FF9800',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
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
                  padding: '10px 8px',
                  border: 'none',
                  borderRadius: '12px',
                  background: '#E91E63',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
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
                  padding: '10px 8px',
                  border: 'none',
                  borderRadius: '12px',
                  background: '#673AB7',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 3px rgba(103,58,183,0.3)'
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
                padding: '11px',
                background: '#1976D2',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 1px 3px rgba(25,118,210,0.3)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span className="material-icons" style={{fontSize: '20px'}}>add_circle_outline</span>
              맞춤 플랜박스
            </button>
          </div>
          
          {/* 필터링 영역 */}
          <div 
            className="filter-zone" 
            style={{
              padding: '8px 12px', 
              background: '#FAFBFC', 
              borderBottom: '1px solid #E5E8EB'
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <span style={{fontSize: '13px', color: '#495057', fontWeight: '500'}}>필터</span>
              <select 
                id="categoryFilter" 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  flex: 1, 
                  padding: '5px 8px', 
                  border: '1px solid #dee2e6', 
                  borderRadius: '4px', 
                  background: 'white', 
                  fontSize: '13px', 
                  cursor: 'pointer'
                }}
              >
                <option value="all">전체</option>
                <option value="food">식사</option>
                <option value="transport">이동</option>
                <option value="activity">활동</option>
                <option value="sightseeing">관광</option>
                <option value="shopping">쇼핑</option>
                <option value="accommodation">숙박</option>
              </select>
            </div>
          </div>
          
          {/* 플랜박스 목록 */}
          <div className="planbox-list" id="planboxList">
            {filteredPlanBoxes.length === 0 ? (
              <div style={{padding: '20px', textAlign: 'center', color: '#6c757d', fontSize: '13px'}}>
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
                    borderLeft: `5px solid ${getCategoryColor(planBox.category)}`,
                    background: cloneSourceId === planBox.id ? 'rgba(102, 126, 234, 0.05)' : undefined,
                    border: cloneSourceId === planBox.id ? '2px dashed #667eea' : undefined,
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
                  onMouseEnter={(e) => {
                    const controls = e.currentTarget.querySelector('.planbox-controls') as HTMLElement
                    if (controls) controls.style.display = 'flex'
                  }}
                  onMouseLeave={(e) => {
                    const controls = e.currentTarget.querySelector('.planbox-controls') as HTMLElement
                    if (controls) controls.style.display = 'none'
                  }}
                >
                  <div style={{position: 'relative', padding: '4px 4px 20px 4px', height: '100%', display: 'flex', flexDirection: 'column'}}>
                    {/* 상단: 시간 + 제목 */}
                    <div style={{display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '3px'}}>
                      <span className="planbox-time" style={{fontSize: '12px', color: '#000', flexShrink: 0}}>
                        {planBox.startHour !== null && planBox.startMinute !== null && planBox.hasTimeSet ? 
                          formatTime(planBox.startHour, planBox.startMinute) : 
                          '시간 미설정'
                        }
                      </span>
                      <div className="planbox-title" style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', lineHeight: '1.2', color: '#000'}}>
                        {planBox.title}
                      </div>
                    </div>
                    
                    {/* 중간 컨텐츠 */}
                    <div style={{flex: 1}}>
                      {/* 메모 (있을 경우만 표시) */}
                      {planBox.memo && (
                        <div className="planbox-memo" style={{fontSize: '11px', color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px'}}>
                          📝 {planBox.memo}
                        </div>
                      )}
                      
                      {/* 위치 (있을 경우만 표시) */}
                      {planBox.location && (
                        <div className="planbox-location" style={{fontSize: '11px', color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                          📍 {planBox.location}
                        </div>
                      )}
                    </div>
                    
                    {/* 하단: 소요시간 (왼쪽) */}
                    <div style={{marginTop: 'auto', marginBottom: '8px'}}>
                      <span className="planbox-duration" style={{
                        fontSize: '10px', 
                        color: '#000', 
                        background: 'rgba(0,0,0,0.05)', 
                        padding: '1px 4px', 
                        borderRadius: '4px'
                      }}>
                        {formatDuration(planBox.durationHour, planBox.durationMinute)}
                      </span>
                    </div>
                    
                    {/* 컨트롤 버튼들 - 오른쪽 하단 */}
                    <div className="planbox-controls" style={{position: 'absolute', bottom: '4px', right: '3px', display: 'none', gap: '2px'}}>
                      <button 
                        className={`planbox-control clone ${cloneSourceId === planBox.id ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCloneMode(planBox.id)
                        }}
                        title="복사 모드"
                        style={{
                          width: '20px',
                          height: '20px',
                          background: cloneSourceId === planBox.id ? '#667eea' : 'transparent',
                          color: cloneSourceId === planBox.id ? 'white' : '#999',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (cloneSourceId !== planBox.id) {
                            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
                            e.currentTarget.style.color = '#667eea'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (cloneSourceId !== planBox.id) {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = '#999'
                          }
                        }}
                      >
                        <span className="material-icons" style={{fontSize: '14px'}}>content_copy</span>
                      </button>
                      <button 
                        className="planbox-control view"
                        onClick={(e) => {
                          e.stopPropagation()
                          editPlanBox(planBox)
                        }}
                        title="편집"
                        style={{
                          width: '20px',
                          height: '20px',
                          background: 'transparent',
                          color: '#999',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
                          e.currentTarget.style.color = '#667eea'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#999'
                        }}
                      >
                        <span className="material-icons" style={{fontSize: '14px'}}>edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
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
                      <option value={0}>00분</option>
                      <option value={10}>10분</option>
                      <option value={20}>20분</option>
                      <option value={30}>30분</option>
                      <option value={40}>40분</option>
                      <option value={50}>50분</option>
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
                      <option value={0}>0분</option>
                      <option value={10}>10분</option>
                      <option value={20}>20분</option>
                      <option value={30}>30분</option>
                      <option value={40}>40분</option>
                      <option value={50}>50분</option>
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
                    <span className="material-icons-outlined" style={{fontSize: '14px', verticalAlign: 'middle'}}>payments</span>
                    예상 비용
                  </label>
                  <input 
                    type="text" 
                    value={currentPlanBox.cost}
                    onChange={(e) => setCurrentPlanBox({...currentPlanBox, cost: e.target.value})}
                    placeholder="예: 3,000원"
                    style={{width: '100%', padding: '7px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
                  />
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
                      fontSize: '14px',
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
                    fontSize: '14px',
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
    </div>
  )
}