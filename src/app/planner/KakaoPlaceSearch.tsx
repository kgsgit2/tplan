'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { debounce } from 'lodash'

interface PlaceSearchProps {
  onSelectPlace: (place: any) => void
  currentLocation?: string
  placeholder?: string
  defaultValue?: string
  autoFocus?: boolean
  compact?: boolean
  onClear?: () => void
}

interface SearchResult {
  id: string
  place_name: string
  category_name: string
  address_name: string
  road_address_name: string
  x: string // longitude
  y: string // latitude
  distance?: string
  phone?: string
}

export default function KakaoPlaceSearch({ 
  onSelectPlace, 
  currentLocation,
  placeholder = "장소를 검색하세요",
  defaultValue = "",
  autoFocus = false,
  compact = false,
  onClear
}: PlaceSearchProps) {
  const [searchQuery, setSearchQuery] = useState(defaultValue)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const searchServiceRef = useRef<any>(null)

  // Initialize Kakao Places Service
  useEffect(() => {
    const checkKakao = () => {
      if (typeof window !== 'undefined' && window.kakao && window.kakao.maps && window.kakao.maps.services) {
        searchServiceRef.current = new window.kakao.maps.services.Places()
        setIsKakaoLoaded(true)
        return true
      }
      return false
    }

    if (!checkKakao()) {
      const interval = setInterval(() => {
        if (checkKakao()) {
          clearInterval(interval)
        }
      }, 100)

      return () => clearInterval(interval)
    }
  }, [])

  // Debounced search function
  const performSearch = useCallback(
    debounce((query: string) => {
      if (!searchServiceRef.current || !query.trim()) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)

      const callback = (result: any, status: any) => {
        setIsSearching(false)
        
        if (status === window.kakao.maps.services.Status.OK) {
          setSearchResults(result.slice(0, 8)) // Limit to 8 results
          setShowResults(true)
          setSelectedIndex(-1)
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          setSearchResults([])
          setShowResults(true)
        } else {
          console.error('Place search error:', status)
          setSearchResults([])
        }
      }

      // Search options
      const options: any = {
        size: 8
      }

      // Add location bias if current location is available
      if (currentLocation) {
        const coords = currentLocation.split(',')
        if (coords.length === 2) {
          options.location = new window.kakao.maps.LatLng(
            parseFloat(coords[0]),
            parseFloat(coords[1])
          )
          options.sort = window.kakao.maps.services.SortBy.DISTANCE
        }
      }

      searchServiceRef.current.keywordSearch(query, callback, options)
    }, 300),
    [currentLocation]
  )

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    if (query.trim()) {
      performSearch(query)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }

  // Handle place selection
  const handleSelectPlace = (place: SearchResult) => {
    setSearchQuery(place.place_name)
    setShowResults(false)
    
    onSelectPlace({
      id: place.id,
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      category: place.category_name,
      lat: parseFloat(place.y),
      lng: parseFloat(place.x),
      phone: place.phone
    })
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelectPlace(searchResults[selectedIndex])
        }
        break
      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto focus
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Update search query when default value changes
  useEffect(() => {
    setSearchQuery(defaultValue)
  }, [defaultValue])

  // Get category icon
  const getCategoryIcon = (category: string) => {
    if (category.includes('음식점') || category.includes('카페')) return 'restaurant'
    if (category.includes('숙박')) return 'hotel'
    if (category.includes('관광')) return 'attractions'
    if (category.includes('쇼핑')) return 'shopping_bag'
    if (category.includes('병원') || category.includes('약국')) return 'local_hospital'
    if (category.includes('은행')) return 'account_balance'
    if (category.includes('주유')) return 'local_gas_station'
    if (category.includes('지하철') || category.includes('역')) return 'subway'
    if (category.includes('버스')) return 'directions_bus'
    return 'place'
  }

  // Format distance
  const formatDistance = (distance?: string) => {
    if (!distance) return null
    const d = parseInt(distance)
    if (d < 1000) return `${d}m`
    return `${(d / 1000).toFixed(1)}km`
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Search Input */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}>
        <span 
          className="material-icons" 
          style={{ 
            position: 'absolute',
            left: compact ? '10px' : '12px',
            color: '#9ca3af',
            fontSize: compact ? '18px' : '20px',
            pointerEvents: 'none'
          }}
        >
          search
        </span>
        
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowResults(true)
            }
          }}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: compact ? '8px 36px 8px 36px' : '10px 40px',
            border: '1px solid #e5e7eb',
            borderRadius: compact ? '6px' : '8px',
            fontSize: compact ? '13px' : '14px',
            outline: 'none',
            transition: 'all 0.2s',
            backgroundColor: 'white'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6'
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb'
            e.target.style.boxShadow = 'none'
          }}
          disabled={!isKakaoLoaded}
        />
        
        {/* Clear button */}
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('')
              setSearchResults([])
              setShowResults(false)
              searchInputRef.current?.focus()
              onClear?.()
            }}
            style={{
              position: 'absolute',
              right: compact ? '10px' : '12px',
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
              e.currentTarget.style.color = '#6b7280'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#9ca3af'
            }}
          >
            <span className="material-icons" style={{ fontSize: compact ? '18px' : '20px' }}>
              close
            </span>
          </button>
        )}
        
        {/* Loading indicator */}
        {isSearching && (
          <div style={{
            position: 'absolute',
            right: searchQuery ? '40px' : '12px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div className="spinner" style={{
              width: '16px',
              height: '16px',
              border: '2px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div
          ref={resultsRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e5e7eb',
            maxHeight: compact ? '280px' : '320px',
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          {searchResults.length > 0 ? (
            searchResults.map((place, index) => (
              <button
                key={place.id}
                onClick={() => handleSelectPlace(place)}
                style={{
                  width: '100%',
                  padding: compact ? '10px 12px' : '12px 16px',
                  border: 'none',
                  borderBottom: index < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                  backgroundColor: selectedIndex === index ? '#f0f9ff' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f9ff'
                  setSelectedIndex(index)
                }}
                onMouseLeave={(e) => {
                  if (selectedIndex !== index) {
                    e.currentTarget.style.backgroundColor = 'white'
                  }
                }}
              >
                {/* Place Icon */}
                <span 
                  className="material-icons" 
                  style={{ 
                    color: '#6b7280',
                    fontSize: compact ? '18px' : '20px',
                    marginTop: '2px'
                  }}
                >
                  {getCategoryIcon(place.category_name)}
                </span>
                
                {/* Place Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: compact ? '13px' : '14px',
                    fontWeight: '500',
                    color: '#1a1a1a',
                    marginBottom: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {place.place_name}
                  </div>
                  <div style={{
                    fontSize: compact ? '11px' : '12px',
                    color: '#6b7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {place.road_address_name || place.address_name}
                  </div>
                  {place.category_name && (
                    <div style={{
                      fontSize: compact ? '10px' : '11px',
                      color: '#9ca3af',
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>{place.category_name.split('>').pop()?.trim()}</span>
                      {place.distance && (
                        <span>• {formatDistance(place.distance)}</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: compact ? '13px' : '14px'
            }}>
              {isSearching ? '검색 중...' : '검색 결과가 없습니다'}
            </div>
          )}
        </div>
      )}

      {/* Inline styles for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}