// UX IMPROVEMENTS - Ready-to-implement React components and hooks
// These address the critical issues identified in the UX audit

import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion, useSpring, useMotionValue } from 'framer-motion'

// ============================================
// 1. ONBOARDING FLOW COMPONENT
// ============================================
interface OnboardingStep {
  target: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

export const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  
  const steps: OnboardingStep[] = [
    {
      target: '.planbox-list',
      title: 'Your Activity Library',
      content: 'Browse and select activities to add to your trip. Drag any item to get started!',
      position: 'right'
    },
    {
      target: '.timeline-container',
      title: 'Your Trip Timeline',
      content: 'Drop activities here to schedule them. Drag to rearrange, resize to adjust duration.',
      position: 'left'
    },
    {
      target: '.quick-buttons',
      title: 'Quick Add Activities',
      content: 'Use these buttons to quickly add common activities like meals, transport, and sightseeing.',
      position: 'bottom'
    },
    {
      target: '.header-controls',
      title: 'Trip Settings',
      content: 'Set your trip dates and destination here. Everything auto-saves as you work!',
      position: 'bottom'
    }
  ]

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('tplan-onboarding-complete')
    if (!hasSeenOnboarding) {
      setIsVisible(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const completeOnboarding = () => {
    localStorage.setItem('tplan-onboarding-complete', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  const currentStepData = steps[currentStep]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="onboarding-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9999
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="onboarding-tooltip"
          style={{
            position: 'absolute',
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '320px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6B7280' }}>
            Step {currentStep + 1} of {steps.length}
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
            {currentStepData.title}
          </h3>
          <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '20px' }}>
            {currentStepData.content}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={completeOnboarding}
              style={{
                padding: '8px 16px',
                background: '#F3F4F6',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Skip Tour
            </button>
            <button
              onClick={handleNext}
              style={{
                padding: '8px 16px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================
// 2. ACCESSIBILITY IMPROVEMENTS
// ============================================
export const useAccessibleDragDrop = () => {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItem, setDraggedItem] = useState<any>(null)
  const [focusedItem, setFocusedItem] = useState<string | null>(null)

  const handleKeyboardDrag = useCallback((e: KeyboardEvent, item: any) => {
    switch(e.key) {
      case ' ':
      case 'Enter':
        if (!isDragging) {
          setIsDragging(true)
          setDraggedItem(item)
          announceToScreenReader(`Picked up ${item.title}. Use arrow keys to move.`)
        } else {
          // Drop the item
          setIsDragging(false)
          announceToScreenReader(`Dropped ${item.title}`)
        }
        e.preventDefault()
        break
      
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (isDragging) {
          // Move the dragged item
          moveDraggedItem(e.key)
          e.preventDefault()
        }
        break
      
      case 'Escape':
        if (isDragging) {
          setIsDragging(false)
          setDraggedItem(null)
          announceToScreenReader('Drag cancelled')
          e.preventDefault()
        }
        break
    }
  }, [isDragging, draggedItem])

  const moveDraggedItem = (direction: string) => {
    // Implementation for moving item with keyboard
    const announcement = `Moving ${direction.replace('Arrow', '').toLowerCase()}`
    announceToScreenReader(announcement)
  }

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }

  return {
    isDragging,
    draggedItem,
    handleKeyboardDrag,
    focusedItem,
    setFocusedItem
  }
}

// ============================================
// 3. PERFORMANCE OPTIMIZATIONS
// ============================================
export const useOptimizedDragDrop = () => {
  const rafRef = useRef<number>()
  const lastUpdateRef = useRef<number>(0)
  
  const throttledUpdate = useCallback((callback: () => void, fps = 60) => {
    const now = Date.now()
    const targetInterval = 1000 / fps
    
    if (now - lastUpdateRef.current >= targetInterval) {
      lastUpdateRef.current = now
      callback()
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => throttledUpdate(callback, fps))
    }
  }, [])

  return { throttledUpdate }
}

// ============================================
// 4. MOBILE TOUCH OPTIMIZATIONS
// ============================================
export const useTouchGestures = (elementRef: React.RefObject<HTMLElement>) => {
  const [gesture, setGesture] = useState<string | null>(null)
  const touchStartRef = useRef<{ x: number; y: number; time: number }>()
  const lastTapRef = useRef<number>(0)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }

      // Double tap detection
      const now = Date.now()
      if (now - lastTapRef.current < 300) {
        setGesture('doubleTap')
      }
      lastTapRef.current = now
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return
      
      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      
      // Swipe detection
      if (Math.abs(deltaX) > 50) {
        setGesture(deltaX > 0 ? 'swipeRight' : 'swipeLeft')
      } else if (Math.abs(deltaY) > 50) {
        setGesture(deltaY > 0 ? 'swipeDown' : 'swipeUp')
      }
    }

    const handleTouchEnd = () => {
      touchStartRef.current = undefined
      setTimeout(() => setGesture(null), 100)
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [elementRef])

  return gesture
}

// ============================================
// 5. LOADING STATES & SKELETON SCREENS
// ============================================
export const SkeletonScreen = ({ type }: { type: 'planbox' | 'timeline' | 'modal' }) => {
  const shimmer = {
    initial: { backgroundPosition: '-200% 0' },
    animate: { 
      backgroundPosition: '200% 0',
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear'
      }
    }
  }

  if (type === 'planbox') {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        variants={shimmer}
        style={{
          height: '80px',
          borderRadius: '8px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          marginBottom: '8px'
        }}
      />
    )
  }

  if (type === 'timeline') {
    return (
      <div style={{ padding: '20px' }}>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial="initial"
            animate="animate"
            variants={shimmer}
            style={{
              height: '60px',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              marginBottom: '12px',
              opacity: 1 - (i * 0.1)
            }}
          />
        ))}
      </div>
    )
  }

  return null
}

// ============================================
// 6. UNDO/REDO SYSTEM
// ============================================
export const useUndoRedo = <T,>(initialState: T) => {
  const [state, setState] = useState<T>(initialState)
  const [history, setHistory] = useState<T[]>([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)

  const updateState = useCallback((newState: T) => {
    const newHistory = history.slice(0, currentIndex + 1)
    newHistory.push(newState)
    
    // Limit history to 50 items
    if (newHistory.length > 50) {
      newHistory.shift()
    }
    
    setHistory(newHistory)
    setCurrentIndex(newHistory.length - 1)
    setState(newState)
  }, [history, currentIndex])

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      setState(history[newIndex])
      announceAction('Undo')
    }
  }, [currentIndex, history])

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      setState(history[newIndex])
      announceAction('Redo')
    }
  }, [currentIndex, history])

  const announceAction = (action: string) => {
    // Visual feedback
    const toast = document.createElement('div')
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #1F2937;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      animation: slideUp 0.3s ease-out;
    `
    toast.textContent = action
    document.body.appendChild(toast)
    setTimeout(() => document.body.removeChild(toast), 2000)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [undo, redo])

  return {
    state,
    updateState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1
  }
}

// ============================================
// 7. IMPROVED ERROR HANDLING
// ============================================
export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true)
      setError(new Error(event.message))
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError && error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>😔</div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px' }}>
          Oops! Something went wrong
        </h2>
        <p style={{ color: '#6B7280', marginBottom: '24px', maxWidth: '400px' }}>
          We encountered an unexpected error. Don't worry, your work is saved. 
          Try refreshing the page or contact support if the problem persists.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
          <button
            onClick={() => setHasError(false)}
            style={{
              padding: '10px 20px',
              background: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: '24px', fontSize: '12px', color: '#9CA3AF' }}>
            <summary style={{ cursor: 'pointer' }}>Error Details</summary>
            <pre style={{ marginTop: '12px', textAlign: 'left' }}>
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    )
  }

  return <>{children}</>
}

// ============================================
// 8. RESPONSIVE BREAKPOINT SYSTEM
// ============================================
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setBreakpoint('mobile')
      } else if (width < 1024) {
        setBreakpoint('tablet')
      } else {
        setBreakpoint('desktop')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    breakpoint
  }
}

// ============================================
// 9. HAPTIC FEEDBACK (Mobile)
// ============================================
export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])

  return {
    light: () => vibrate(10),
    medium: () => vibrate(20),
    heavy: () => vibrate(30),
    success: () => vibrate([10, 20, 10]),
    warning: () => vibrate([20, 10, 20]),
    error: () => vibrate([30, 10, 30, 10, 30])
  }
}

// ============================================
// 10. AUTOSAVE WITH DEBOUNCE
// ============================================
export const useAutoSave = (data: any, delay = 1000) => {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsSaving(true)

    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem('tplan-autosave', JSON.stringify({
          data,
          timestamp: new Date().toISOString()
        }))
        setLastSaved(new Date())
        setIsSaving(false)
        
        // Show save indicator
        showSaveIndicator()
      } catch (error) {
        console.error('Autosave failed:', error)
        setIsSaving(false)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay])

  const showSaveIndicator = () => {
    const indicator = document.createElement('div')
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10B981;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 10000;
      animation: fadeInOut 2s ease-out;
    `
    indicator.innerHTML = '✓ Saved'
    document.body.appendChild(indicator)
    setTimeout(() => document.body.removeChild(indicator), 2000)
  }

  return { isSaving, lastSaved }
}

// ============================================
// CSS ANIMATIONS TO ADD TO GLOBAL STYLES
// ============================================
export const animationStyles = `
@keyframes slideUp {
  from {
    transform: translate(-50%, 100%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  20% {
    opacity: 1;
    transform: translateY(0);
  }
  80% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Focus visible styles for accessibility */
*:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Touch target minimum size */
button, a, input, select, textarea {
  min-height: 44px;
  min-width: 44px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1F2937;
    --bg-secondary: #111827;
    --text-primary: #F9FAFB;
    --text-secondary: #D1D5DB;
  }
}
`