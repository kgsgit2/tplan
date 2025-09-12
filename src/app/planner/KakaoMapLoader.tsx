'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    kakao: any
    kakaoMapInitialized?: boolean
  }
}

interface KakaoMapLoaderProps {
  onLoad: () => void
  onError: (error: string) => void
}

export default function KakaoMapLoader({ onLoad, onError }: KakaoMapLoaderProps) {
  const [loadStatus, setLoadStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      console.log('[KakaoMapLoader] 카카오 맵 이미 로드됨')
      setLoadStatus('success')
      onLoad()
      return
    }

    // 이미 초기화 중인 경우
    if (window.kakaoMapInitialized) {
      console.log('[KakaoMapLoader] 카카오 맵 초기화 진행 중...')
      return
    }

    window.kakaoMapInitialized = true

    // 스크립트가 이미 있는지 확인
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]')
    if (existingScript) {
      console.log('[KakaoMapLoader] 스크립트 태그 존재, 로드 대기 중...')
      
      let checkCount = 0
      const checkInterval = setInterval(() => {
        checkCount++
        if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
          console.log('[KakaoMapLoader] 카카오 맵 로드 완료!')
          clearInterval(checkInterval)
          setLoadStatus('success')
          onLoad()
        } else if (checkCount > 100) { // 10초 타임아웃
          console.error('[KakaoMapLoader] 로드 타임아웃')
          clearInterval(checkInterval)
          setLoadStatus('error')
          setErrorMessage('카카오 맵 로드 타임아웃')
          onError('카카오 맵 로드 타임아웃')
        }
      }, 100)
      
      return () => clearInterval(checkInterval)
    }

    console.log('[KakaoMapLoader] 새 스크립트 태그 생성...')
    
    // 환경 변수에서 API 키 가져오기
    const apiKeys = [
      process.env.NEXT_PUBLIC_KAKAO_API_KEY || 'd0d67d94afae47e0ab9c29b0e6aea5cf',
    ]
    
    let keyIndex = 0
    
    const loadScript = () => {
      if (keyIndex >= apiKeys.length) {
        console.error('[KakaoMapLoader] 모든 API 키 시도 실패')
        setLoadStatus('error')
        setErrorMessage('모든 API 키로 로드 실패')
        onError('모든 API 키로 로드 실패')
        return
      }
      
      const script = document.createElement('script')
      const currentKey = apiKeys[keyIndex]
      
      // 다양한 URL 형식 시도
      const urls = [
        `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${currentKey}&libraries=services`,
        `//dapi.kakao.com/v2/maps/sdk.js?appkey=${currentKey}&libraries=services`,
      ]
      
      script.src = urls[0]
      script.async = true
      script.defer = true
      
      console.log(`[KakaoMapLoader] API 키 ${keyIndex + 1}/${apiKeys.length} 시도 중...`)
      console.log(`[KakaoMapLoader] URL: ${script.src}`)
      
      script.onload = () => {
        console.log('[KakaoMapLoader] 스크립트 태그 로드 성공')
        
        // 로드 확인
        setTimeout(() => {
          if (window.kakao && window.kakao.maps) {
            console.log('[KakaoMapLoader] kakao 객체 확인됨')
            
            // services 라이브러리 확인
            if (window.kakao.maps.services) {
              console.log('[KakaoMapLoader] services 라이브러리 로드 완료')
              setLoadStatus('success')
              onLoad()
            } else {
              console.log('[KakaoMapLoader] services 라이브러리 대기 중...')
              
              // services 로드 대기
              let serviceCheckCount = 0
              const serviceCheckInterval = setInterval(() => {
                serviceCheckCount++
                if (window.kakao.maps.services) {
                  console.log('[KakaoMapLoader] services 라이브러리 로드 완료 (지연)')
                  clearInterval(serviceCheckInterval)
                  setLoadStatus('success')
                  onLoad()
                } else if (serviceCheckCount > 30) { // 3초 대기
                  console.error('[KakaoMapLoader] services 라이브러리 로드 실패')
                  clearInterval(serviceCheckInterval)
                  keyIndex++
                  script.remove()
                  loadScript() // 다음 키 시도
                }
              }, 100)
            }
          } else {
            console.error('[KakaoMapLoader] kakao 객체를 찾을 수 없음')
            keyIndex++
            script.remove()
            loadScript() // 다음 키 시도
          }
        }, 500)
      }
      
      script.onerror = (error) => {
        console.error('[KakaoMapLoader] 스크립트 로드 에러:', error)
        console.log('[KakaoMapLoader] 가능한 원인:')
        console.log('1. 카카오 개발자 사이트에서 도메인 등록 필요')
        console.log('2. API 키가 유효하지 않음')
        console.log('3. 네트워크 연결 문제')
        
        keyIndex++
        script.remove()
        loadScript() // 다음 키 시도
      }
      
      document.head.appendChild(script)
    }
    
    loadScript()
    
    return () => {
      window.kakaoMapInitialized = false
    }
  }, [onLoad, onError])

  return null // 이 컴포넌트는 UI를 렌더링하지 않음
}

// 카카오 맵 API 사용 가능 여부 확인 함수
export function isKakaoMapAvailable(): boolean {
  return !!(window.kakao && window.kakao.maps && window.kakao.maps.services)
}