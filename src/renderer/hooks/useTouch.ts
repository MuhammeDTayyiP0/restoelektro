import { useEffect, useState, useRef } from 'react'

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number // kaydırma eşik değeri (px)
}

/**
 * Dokunmatik ekranlar için basit swipe (kaydırma) hook'u
 */
export function useTouch(handlers: SwipeHandlers) {
  const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = handlers
  
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number, y: number } | null>(null)
  
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)
    
    // Yatay Kaydırma
    if (isHorizontalSwipe && Math.abs(distanceX) > threshold) {
      if (distanceX > 0 && onSwipeLeft) {
        onSwipeLeft()
      } else if (distanceX < 0 && onSwipeRight) {
        onSwipeRight()
      }
    } 
    // Dikey Kaydırma
    else if (!isHorizontalSwipe && Math.abs(distanceY) > threshold) {
      if (distanceY > 0 && onSwipeUp) {
        onSwipeUp()
      } else if (distanceY < 0 && onSwipeDown) {
        onSwipeDown()
      }
    }

    // Reset
    setTouchStart(null)
    setTouchEnd(null)
    
  }, [touchEnd]) // touchEnd değiştiğinde kontrol et

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null) // reset end
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }
  
  const onTouchEnd = () => {
    // End tetiklenmesi useEffect'e bırakıldı
  }

  return {
    ref,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}
