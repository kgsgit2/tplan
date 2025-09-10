'use client'

import { PlanBox, CategoryType } from '@/types/planner.types'
import { useState, useEffect } from 'react'

interface PlanBoxModalProps {
  isOpen: boolean
  planBox?: PlanBox
  onSave: (planBox: Partial<PlanBox>) => void
  onDelete?: (id: string) => void
  onClose: () => void
  presetHour?: number
  presetMinute?: number
}

const categories: { value: CategoryType; label: string; icon: string; color: string }[] = [
  { value: 'food', label: '식사', icon: '🍽️', color: 'border-l-food' },
  { value: 'transport', label: '이동', icon: '🚗', color: 'border-l-transport' },
  { value: 'activity', label: '활동', icon: '⚽', color: 'border-l-activity' },
  { value: 'sightseeing', label: '관광', icon: '📷', color: 'border-l-sightseeing' },
  { value: 'shopping', label: '쇼핑', icon: '🛍️', color: 'border-l-shopping' },
  { value: 'accommodation', label: '숙박', icon: '🏨', color: 'border-l-accommodation' }
]

const durations = [
  { value: 10, label: '10분' },
  { value: 20, label: '20분' },
  { value: 30, label: '30분' },
  { value: 40, label: '40분' },
  { value: 50, label: '50분' },
  { value: 60, label: '1시간' },
  { value: 90, label: '1시간 30분' },
  { value: 120, label: '2시간' },
  { value: 180, label: '3시간' },
  { value: 240, label: '4시간' },
  { value: 300, label: '5시간' },
  { value: 360, label: '6시간' },
  { value: 480, label: '8시간' },
  { value: 720, label: '12시간' }
]

export default function PlanBoxModal({ 
  isOpen, 
  planBox, 
  onSave, 
  onDelete, 
  onClose, 
  presetHour, 
  presetMinute 
}: PlanBoxModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'food' as CategoryType,
    startTime: '',
    duration: 60,
    memo: '',
    location: '',
    cost: 0,
    currency: 'KRW'
  })

  const [endTime, setEndTime] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (planBox) {
        // 편집 모드
        setFormData({
          title: planBox.title,
          category: planBox.category,
          startTime: planBox.startTime,
          duration: planBox.duration,
          memo: planBox.memo || '',
          location: planBox.location || '',
          cost: planBox.cost || 0,
          currency: planBox.currency || 'KRW'
        })
      } else {
        // 새 플랜박스 생성 모드
        const hour = presetHour ?? 9
        const minute = presetMinute ?? 0
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        
        setFormData({
          title: '',
          category: 'food',
          startTime,
          duration: 60,
          memo: '',
          location: '',
          cost: 0,
          currency: 'KRW'
        })
      }
    }
  }, [isOpen, planBox, presetHour, presetMinute])

  // 종료 시간 계산
  useEffect(() => {
    if (formData.startTime && formData.duration) {
      const [hours, minutes] = formData.startTime.split(':').map(Number)
      if (!isNaN(hours) && !isNaN(minutes)) {
        const totalMinutes = hours * 60 + minutes + formData.duration
        const endHours = Math.floor(totalMinutes / 60) % 24
        const endMinutes = totalMinutes % 60
        setEndTime(`${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`)
      }
    }
  }, [formData.startTime, formData.duration])

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    onSave({
      ...formData,
      id: planBox?.id,
      tripId: planBox?.tripId || 'temp',
      day: planBox?.day || 1,
      position: planBox?.position
    })
  }

  const handleDelete = () => {
    if (planBox && onDelete) {
      if (confirm('정말 삭제하시겠습니까?')) {
        onDelete(planBox.id)
      }
    }
  }

  const handleTitleEdit = () => {
    setIsEditingTitle(true)
  }

  const handleTitleSave = (value: string) => {
    setFormData(prev => ({ ...prev, title: value }))
    setIsEditingTitle(false)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">
            {planBox ? '플랜박스 편집' : '새 플랜박스'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium mb-2">제목</label>
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  onBlur={(e) => handleTitleSave(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTitleSave(formData.title)
                    } else if (e.key === 'Escape') {
                      setIsEditingTitle(false)
                    }
                  }}
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              ) : (
                <>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    onClick={handleTitleEdit}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="플랜박스 제목을 입력하세요"
                  />
                  <button
                    onClick={handleTitleEdit}
                    className="p-2 hover:bg-gray-100 rounded"
                    title="제목 편집"
                  >
✏️
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium mb-2">카테고리</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg border-2 transition-all
                    ${formData.category === cat.value 
                      ? `border-${cat.value} bg-${cat.value} bg-opacity-10` 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 시간 설정 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">시작 시간</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">소요 시간</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {durations.map(dur => (
                  <option key={dur.value} value={dur.value}>
                    {dur.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 종료 시간 표시 */}
          {endTime && (
            <div className="text-sm text-gray-600">
              종료 시간: <span className="font-medium">{endTime}</span>
            </div>
          )}

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium mb-2">메모</label>
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="메모를 입력하세요"
            />
          </div>

          {/* 위치 */}
          <div>
            <label className="block text-sm font-medium mb-2">위치</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="위치를 입력하세요"
              />
              <button className="px-4 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors">
                지도
              </button>
            </div>
          </div>

          {/* 비용 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">비용</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="0"
                step="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">통화</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="KRW">원</option>
                <option value="USD">달러</option>
                <option value="EUR">유로</option>
                <option value="JPY">엔</option>
              </select>
            </div>
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex justify-between items-center p-4 border-t">
          <div>
            {planBox && onDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                삭제
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              {planBox ? '수정' : '생성'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}