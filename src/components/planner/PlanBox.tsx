'use client'

import { PlanBox as PlanBoxType, CategoryType } from '@/types/planner.types'
import { useState } from 'react'

interface PlanBoxProps {
  planBox: PlanBoxType
  onEdit?: (planBox: PlanBoxType) => void
  onClone?: (planBox: PlanBoxType) => void
  isDragging?: boolean
  isCloneMode?: boolean
}

const categoryIcons: Record<CategoryType, string> = {
  food: '🍽️',
  transport: '🚗',
  activity: '⚽',
  sightseeing: '📷',
  shopping: '🛍️',
  accommodation: '🏨'
}

const categoryLabels: Record<CategoryType, string> = {
  food: '식사',
  transport: '이동',
  activity: '활동',
  sightseeing: '관광',
  shopping: '쇼핑',
  accommodation: '숙박'
}

export default function PlanBox({ 
  planBox, 
  onEdit, 
  onClone, 
  isDragging = false,
  isCloneMode = false 
}: PlanBoxProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // 시간 표시 처리
  const formatTime = (time: string) => {
    if (!time) return '시간 미설정'
    return time
  }
  
  // 종료 시간 계산
  const calculateEndTime = () => {
    if (!planBox.startTime || !planBox.duration) return ''
    
    const [hours, minutes] = planBox.startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + planBox.duration
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMinutes = totalMinutes % 60
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }
  
  // 지속시간 텍스트 포맷
  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    
    if (hours === 0) {
      return `${minutes}분`
    } else if (minutes === 0) {
      return `${hours}시간`
    } else {
      return `${hours}시간 ${minutes}분`
    }
  }
  
  const endTime = calculateEndTime()
  
  return (
    <div
      className={`
        planbox ${planBox.category} 
        ${isDragging ? 'dragging' : ''}
        ${isCloneMode ? 'clone-mode' : ''}
        transition-all duration-300 cursor-move
      `}
      draggable
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 시간 헤더 */}
      <div className="planbox-time-header flex justify-between items-center mb-1">
        <span className="planbox-time text-sm font-medium">
          {formatTime(planBox.startTime)}
          {endTime && (
            <span className="planbox-endtime text-xs text-gray-600 ml-1">
              ~ {endTime}
            </span>
          )}
        </span>
        <span className="planbox-duration text-xs bg-gray-100 px-2 py-1 rounded">
          {formatDuration(planBox.duration)}
        </span>
      </div>
      
      {/* 제목 */}
      <div className="planbox-title font-semibold mb-1 text-sm">
        {categoryIcons[planBox.category]} {planBox.title}
      </div>
      
      {/* 비용 정보 */}
      {planBox.cost && (
        <div className="planbox-cost text-xs text-gray-700 mb-1">
          {planBox.cost}
          {planBox.currency && planBox.currency !== 'KRW' && (
            <span className="ml-1">({planBox.currency})</span>
          )}
        </div>
      )}
      
      {/* 메모 */}
      {planBox.memo && (
        <div className="planbox-memo text-xs text-gray-600 mb-2 line-clamp-2">
          {planBox.memo}
        </div>
      )}
      
      {/* 위치 */}
      {planBox.location && (
        <div className="planbox-location text-xs text-blue-600 mb-2 flex items-center">
📍
          {planBox.location}
        </div>
      )}
      
      {/* 컨트롤 버튼들 */}
      {isHovered && (
        <div className="planbox-controls absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onClone && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClone(planBox)
              }}
              className="planbox-control clone p-1 bg-white rounded shadow hover:bg-gray-50"
              title="복사"
            >
📋
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(planBox)
              }}
              className="planbox-control edit p-1 bg-white rounded shadow hover:bg-gray-50"
              title="편집"
            >
✏️
            </button>
          )}
        </div>
      )}
    </div>
  )
}