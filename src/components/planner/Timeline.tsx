'use client'

import { PlanBox, TimelineConfig, DragDropContext } from '@/types/planner.types'
import { useState, useRef, useEffect } from 'react'

interface TimelineProps {
  planBoxes: PlanBox[]
  config: TimelineConfig
  dragContext: DragDropContext
  onPlanBoxMove: (planBox: PlanBox, newDay: number, newTime: string) => void
  onPlanBoxAdd: (day: number, hour: number, minute: number) => void
  onPlanBoxEdit: (planBox: PlanBox) => void
  totalDays: number
}

interface TimeSlot {
  hour: number
  minute: number
  isOccupied: boolean
  occupiedBy?: string
}

export default function Timeline({
  planBoxes,
  config,
  dragContext,
  onPlanBoxMove,
  onPlanBoxAdd,
  onPlanBoxEdit,
  totalDays
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [timeSlots, setTimeSlots] = useState<Record<number, TimeSlot[]>>({})
  const [hoveredSlot, setHoveredSlot] = useState<{ day: number; hour: number; minute: number } | null>(null)

  // 시간대별 배경색 설정
  const getTimeBlockClass = (hour: number) => {
    if (hour >= 0 && hour < 6) return 'dawn'
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 18) return 'afternoon'
    return 'evening'
  }

  // 시간 슬롯 초기화
  useEffect(() => {
    const newTimeSlots: Record<number, TimeSlot[]> = {}
    
    for (let day = 1; day <= totalDays; day++) {
      newTimeSlots[day] = []
      
      for (let hour = config.minHour; hour <= config.maxHour; hour++) {
        for (let minute = 0; minute < 60; minute += config.snapToMinutes) {
          newTimeSlots[day].push({
            hour,
            minute,
            isOccupied: false,
            occupiedBy: undefined
          })
        }
      }
    }
    
    setTimeSlots(newTimeSlots)
  }, [config, totalDays])

  // 플랜박스 위치에 따른 슬롯 점유 업데이트
  useEffect(() => {
    const updatedSlots = { ...timeSlots }
    
    // 모든 슬롯 초기화
    Object.keys(updatedSlots).forEach(dayKey => {
      const day = parseInt(dayKey)
      updatedSlots[day].forEach(slot => {
        slot.isOccupied = false
        slot.occupiedBy = undefined
      })
    })
    
    // 플랜박스에 따라 슬롯 점유 설정
    planBoxes.forEach(planBox => {
      if (planBox.startTime && updatedSlots[planBox.day]) {
        const [hours, minutes] = planBox.startTime.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes
        const endMinutes = totalMinutes + planBox.duration
        
        for (let minute = totalMinutes; minute < endMinutes; minute += config.snapToMinutes) {
          const hour = Math.floor(minute / 60)
          const min = minute % 60
          
          const slot = updatedSlots[planBox.day].find(s => s.hour === hour && s.minute === min)
          if (slot) {
            slot.isOccupied = true
            slot.occupiedBy = planBox.id
          }
        }
      }
    })
    
    setTimeSlots(updatedSlots)
  }, [planBoxes, config.snapToMinutes])

  // 드래그 오버 처리
  const handleDragOver = (e: React.DragEvent, day: number, hour: number, minute: number) => {
    e.preventDefault()
    setHoveredSlot({ day, hour, minute })
  }

  // 드롭 처리
  const handleDrop = (e: React.DragEvent, day: number, hour: number, minute: number) => {
    e.preventDefault()
    setHoveredSlot(null)
    
    if (dragContext.draggedItem) {
      const newTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      onPlanBoxMove(dragContext.draggedItem, day, newTime)
    }
  }

  // 빈 슬롯 클릭 처리
  const handleEmptySlotClick = (day: number, hour: number, minute: number) => {
    onPlanBoxAdd(day, hour, minute)
  }

  // 시간 라벨 생성
  const generateTimeLabels = () => {
    const labels = []
    for (let hour = config.minHour; hour <= config.maxHour; hour++) {
      labels.push(
        <div key={hour} className="time-label text-xs text-gray-500 py-2 px-1 border-b border-gray-100">
          {hour}
        </div>
      )
    }
    return labels
  }

  // 날짜 헤더 생성
  const generateDayHeaders = () => {
    const headers = []
    for (let day = 1; day <= totalDays; day++) {
      headers.push(
        <div key={day} className="day-header text-sm font-medium p-3 bg-gray-50 border-b border-gray-200 text-center">
          Day {day}
        </div>
      )
    }
    return headers
  }

  return (
    <div className="timeline-container bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="timeline-header grid" style={{ gridTemplateColumns: '60px repeat(' + totalDays + ', 1fr)' }}>
        <div className="time-header bg-gray-100 border-b border-gray-200"></div>
        {generateDayHeaders()}
      </div>

      {/* 타임라인 그리드 */}
      <div ref={timelineRef} className="timeline-grid grid" style={{ gridTemplateColumns: '60px repeat(' + totalDays + ', 1fr)' }}>
        {/* 시간 라벨 열 */}
        <div className="time-labels-column bg-gray-50 border-r border-gray-200">
          {generateTimeLabels()}
        </div>

        {/* 각 날짜 열 */}
        {Array.from({ length: totalDays }, (_, dayIndex) => {
          const day = dayIndex + 1
          const dayPlanBoxes = planBoxes.filter(pb => pb.day === day)
          
          return (
            <div key={day} className="day-column relative border-r border-gray-200">
              {/* 시간 블록들 */}
              {Array.from({ length: config.maxHour - config.minHour + 1 }, (_, hourIndex) => {
                const hour = config.minHour + hourIndex
                const heightPerHour = config.pixelsPerMinute * 60
                
                return (
                  <div
                    key={hour}
                    className={`time-block ${getTimeBlockClass(hour)} border-b border-gray-100 relative`}
                    style={{ minHeight: heightPerHour + 'px' }}
                  >
                    {/* 10분 단위 슬롯들 */}
                    {Array.from({ length: 60 / config.snapToMinutes }, (_, slotIndex) => {
                      const minute = slotIndex * config.snapToMinutes
                      const slot = timeSlots[day]?.find(s => s.hour === hour && s.minute === minute)
                      const isHovered = hoveredSlot?.day === day && hoveredSlot?.hour === hour && hoveredSlot?.minute === minute
                      
                      return (
                        <div
                          key={minute}
                          className={`
                            time-slot absolute w-full cursor-pointer transition-colors
                            ${isHovered ? 'bg-primary-100 border-2 border-dashed border-primary-400' : ''}
                            ${slot?.isOccupied ? 'occupied' : 'hover:bg-gray-50'}
                          `}
                          style={{
                            top: (minute / 60) * heightPerHour + 'px',
                            height: (config.snapToMinutes / 60) * heightPerHour + 'px'
                          }}
                          onDragOver={(e) => !slot?.isOccupied && handleDragOver(e, day, hour, minute)}
                          onDrop={(e) => !slot?.isOccupied && handleDrop(e, day, hour, minute)}
                          onClick={() => !slot?.isOccupied && handleEmptySlotClick(day, hour, minute)}
                        />
                      )
                    })}
                  </div>
                )
              })}

              {/* 배치된 플랜박스들 */}
              {dayPlanBoxes.map(planBox => {
                if (!planBox.startTime) return null
                
                const [hours, minutes] = planBox.startTime.split(':').map(Number)
                const startMinutes = hours * 60 + minutes
                const relativeStart = startMinutes - (config.minHour * 60)
                const top = (relativeStart / 60) * config.pixelsPerMinute * 60
                const height = (planBox.duration / 60) * config.pixelsPerMinute * 60
                
                return (
                  <div
                    key={planBox.id}
                    className={`
                      placed-box absolute left-1 right-1 ${planBox.category}
                      cursor-move rounded shadow-sm border-l-4 bg-white
                      hover:shadow-md transition-all duration-200
                    `}
                    style={{
                      top: top + 'px',
                      height: height + 'px',
                      zIndex: 10
                    }}
                    draggable
                    onClick={() => onPlanBoxEdit(planBox)}
                  >
                    <div className="p-2 h-full overflow-hidden">
                      <div className="text-xs font-medium mb-1 flex justify-between">
                        <span>{planBox.startTime}</span>
                        <span className="text-gray-500">{Math.floor(planBox.duration / 60)}h {planBox.duration % 60}m</span>
                      </div>
                      <div className="text-sm font-semibold mb-1 line-clamp-1">
                        {planBox.title}
                      </div>
                      {planBox.memo && (
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {planBox.memo}
                        </div>
                      )}
                      {planBox.cost && (
                        <div className="text-xs text-green-600 mt-1">
                          {planBox.cost}원
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}