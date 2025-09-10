'use client'

import { useState, useEffect, useRef } from 'react'

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

  // 프로토타입 정확한 기본 시간대 설정
  const [timeRangeStart] = useState(7)  
  const [timeRangeEnd] = useState(23)
  const [dayTimeRanges, setDayTimeRanges] = useState<{[key: number]: TimeRange}>({})
  
  // 드래그앤드롭 상태
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null)
  const [draggedData, setDraggedData] = useState<PlanBox | null>(null)
  const [isFirstDrop, setIsFirstDrop] = useState(true)
  const [originalTimeDisplay, setOriginalTimeDisplay] = useState<string | null>(null)

  // Refs
  const modalTitleEditRef = useRef<HTMLInputElement>(null)

  // 프로토타입 완전 동일한 초기 데이터
  useEffect(() => {
    initializeDefaultData()
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
      'activity': { label: '활동', duration: 60, color: '#579AFF' },
      'sightseeing': { label: '관광', duration: 60, color: '#A374F9' },
      'food': { label: '식사', duration: 60, color: '#FF9500' },
      'shopping': { label: '쇼핑', duration: 60, color: '#FF6B9D' },
      'accommodation': { label: '숙박', duration: 60, color: '#784AF4' }
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
    const transportData: PlanBox = {
      id: Date.now(),
      title: '이동',
      category: 'transport',
      startHour: null,
      startMinute: null,
      durationHour: 0,
      durationMinute: 30,
      cost: '',
      memo: '',
      hasTimeSet: false
    }
    
    setPlanboxData(prev => [...prev, transportData])
    
    if (categoryFilter !== 'all' && categoryFilter !== 'transport') {
      setCategoryFilter('all')
    }
  }

  // 필터링된 플랜박스 목록
  const filteredPlanBoxes = categoryFilter === 'all' 
    ? planboxData 
    : planboxData.filter(box => box.category === categoryFilter)

  // 모달 열기
  function showAddModal() {
    const newPlanBox: PlanBox = {
      id: Date.now(),
      title: '새 플랜',
      category: 'food',
      startHour: 12,
      startMinute: 0,
      durationHour: 1,
      durationMinute: 0,
      cost: '',
      memo: '',
      hasTimeSet: true
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
      {/* 헤더 - 프로토타입 완전 동일 */}
      <div className="header">
        <div className="header-logo">
          <div className="logo-icon">T</div>
          <span style={{color: '#667eea', fontWeight: 'bold', marginLeft: '10px'}}>v10.0 ADAPTIVE</span>
          <button 
            style={{
              background: '#9C27B0', 
              color: 'white', 
              padding: '5px 10px', 
              marginLeft: '10px', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer'
            }}
          >
            <span className="material-icons" style={{fontSize: '16px', verticalAlign: 'middle'}}>compress</span>
            압축 모드
          </button>
          <button 
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
            onClick={() => window.location.reload()}
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
          <button className="btn-print">인쇄</button>
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
                  <div className="day-timebar">
                    <div className="time-range-header">
                      <div className="time-preset-buttons">
                        <button className="preset-btn">표준</button>
                        <button className="preset-btn">설정</button>
                      </div>
                    </div>
                    
                    {/* 개별 시간 라벨 */}
                    {generateTimeSlots(dayIndex).map(hour => (
                      <div key={hour} className="individual-time-label">
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
                      {generateTimeSlots(dayIndex).map(hour => (
                        <div 
                          key={hour}
                          className="time-slot"
                          data-day={dayIndex}
                          data-hour={hour}
                        >
                          {/* 10분 단위 서브 슬롯 */}
                          <div className="absolute inset-0 grid grid-rows-3">
                            <div data-minute={10}></div>
                            <div data-minute={30}></div>
                            <div data-minute={50}></div>
                          </div>
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
                  background: '#00D084',
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
                <option value="custom">맞춤</option>
                <option value="transport">이동</option>
                <option value="activity">활동</option>
                <option value="sightseeing">관광</option>
                <option value="food">식사</option>
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
                  draggable
                  data-id={planBox.id}
                  onDoubleClick={() => editPlanBox(planBox)}
                >
                  <div className="planbox-time-header">
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <span className="planbox-time">
                        {formatTime(planBox.startHour, planBox.startMinute)}
                      </span>
                      {planBox.startHour !== null && planBox.startMinute !== null && (
                        <span className="planbox-endtime">
                          ~{calculateEndTime(planBox.startHour, planBox.startMinute, planBox.durationHour, planBox.durationMinute)}
                        </span>
                      )}
                    </div>
                    <span className="planbox-duration">
                      {formatDuration(planBox.durationHour, planBox.durationMinute)}
                    </span>
                  </div>
                  
                  <div className="planbox-title">{planBox.title}</div>
                  
                  {planBox.cost && (
                    <div className="planbox-info" style={{display: 'block'}}>{planBox.cost}</div>
                  )}
                  
                  {planBox.memo && (
                    <div className="planbox-memo" style={{display: 'block'}}>{planBox.memo}</div>
                  )}
                  
                  {/* 컨트롤 버튼들 - hover 시 표시 */}
                  <div className="planbox-controls" style={{display: 'none'}}>
                    <button className="planbox-control clone">
                      <span className="material-icons">content_copy</span>
                    </button>
                    <button 
                      className="planbox-control delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        deletePlanBox(planBox.id)
                      }}
                    >
                      <span className="material-icons">delete</span>
                    </button>
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
                  <div className="time-inputs">
                    <input 
                      type="number"
                      min="0"
                      max="23"
                      value={currentPlanBox.startHour || 12}
                      onChange={(e) => setCurrentPlanBox({...currentPlanBox, startHour: parseInt(e.target.value) || 12})}
                      style={{width: '100%', padding: '7px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
                    />
                    <span>:</span>
                    <select 
                      value={currentPlanBox.startMinute || 0}
                      onChange={(e) => setCurrentPlanBox({...currentPlanBox, startMinute: parseInt(e.target.value)})}
                      style={{width: '100%', padding: '7px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
                    >
                      <option value={0}>00</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={40}>40</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label style={{fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px', fontWeight: '500'}}>
                    <span className="material-icons-outlined" style={{fontSize: '14px', verticalAlign: 'middle'}}>timer</span>
                    소요 시간
                  </label>
                  <div className="time-inputs">
                    <input 
                      type="number"
                      min="0"
                      max="23"
                      value={currentPlanBox.durationHour}
                      onChange={(e) => setCurrentPlanBox({...currentPlanBox, durationHour: parseInt(e.target.value) || 0})}
                      style={{width: '100%', padding: '7px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
                    />
                    <span>시간</span>
                    <select 
                      value={currentPlanBox.durationMinute}
                      onChange={(e) => setCurrentPlanBox({...currentPlanBox, durationMinute: parseInt(e.target.value)})}
                      style={{width: '100%', padding: '7px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
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
              {currentPlanBox.startHour !== null && currentPlanBox.startMinute !== null && (
                <div className="end-time-display">
                  종료 시간: {calculateEndTime(currentPlanBox.startHour, currentPlanBox.startMinute, currentPlanBox.durationHour, currentPlanBox.durationMinute)}
                </div>
              )}
              
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
            <div className="modal-buttons">
              {isEditing && (
                <button 
                  className="btn-danger"
                  onClick={() => deletePlanBox(currentPlanBox.id)}
                >
                  삭제
                </button>
              )}
              <button className="btn-secondary" onClick={hideModal}>
                취소
              </button>
              <button className="btn-primary" onClick={savePlanBox}>
                {isEditing ? '수정' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}