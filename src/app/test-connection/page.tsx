'use client'

import { useState, useEffect } from 'react'
import { dbHelpers } from '@/lib/supabase'

export default function TestConnectionPage() {
  const [kakaoStatus, setKakaoStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [supabaseStatus, setSupabaseStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [kakaoMessage, setKakaoMessage] = useState('')
  const [supabaseMessage, setSupabaseMessage] = useState('')
  const [needsTable, setNeedsTable] = useState(false)
  const [creatingTable, setCreatingTable] = useState(false)

  useEffect(() => {
    // Test Kakao API
    const testKakao = () => {
      const apiKey = process.env.NEXT_PUBLIC_KAKAO_API_KEY
      
      if (!apiKey) {
        setKakaoStatus('error')
        setKakaoMessage('KAKAO API KEY not found')
        return
      }

      if (apiKey === 'your_kakao_api_key_here') {
        setKakaoStatus('error')
        setKakaoMessage('Kakao API key is placeholder value')
        return
      }

      // Test if Kakao script can be loaded
      const script = document.createElement('script')
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`
      
      script.onload = () => {
        setKakaoStatus('success')
        setKakaoMessage(`Kakao API script loaded successfully with key: ${apiKey.substring(0, 8)}...`)
      }
      
      script.onerror = () => {
        setKakaoStatus('error')
        setKakaoMessage('Failed to load Kakao API script')
      }
      
      document.head.appendChild(script)
    }

    // Test Supabase connection via server-side API
    const testSupabase = async () => {
      try {
        const response = await fetch('/api/test-supabase')
        const result = await response.json()
        
        if (result.success) {
          if (result.needsTable) {
            setSupabaseStatus('error')
            setSupabaseMessage(result.message + ' → Click "Create Table" below.')
            setNeedsTable(true)
          } else {
            setSupabaseStatus('success')
            setSupabaseMessage(result.message)
            setNeedsTable(false)
          }
        } else {
          setSupabaseStatus('error')
          let message = result.message
          if (result.error) {
            message += ` (Step: ${result.step}, Error: ${JSON.stringify(result.error, null, 2)})`
          }
          setSupabaseMessage(message)
        }
      } catch (error) {
        setSupabaseStatus('error')
        setSupabaseMessage(`API call failed: ${error}`)
      }
    }

    testKakao()
    testSupabase()
  }, [])

  const handleCreateTable = async () => {
    setCreatingTable(true)
    try {
      const response = await fetch('/api/create-table', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        // Retry the connection test
        const testResponse = await fetch('/api/test-supabase')
        const testResult = await testResponse.json()
        
        if (testResult.success && !testResult.needsTable) {
          setSupabaseStatus('success')
          setSupabaseMessage(testResult.message)
          setNeedsTable(false)
        }
      } else {
        setSupabaseMessage(`Table creation info: ${result.message}`)
        // If it provides SQL, show that we need manual creation
        if (result.sqlProvided) {
          setSupabaseMessage(result.message + ' Please create the table manually using the SQL provided below.')
        }
      }
    } catch (error) {
      setSupabaseMessage(`Error creating table: ${error}`)
    }
    setCreatingTable(false)
  }

  const getStatusColor = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading': return '#0ea5e9'
      case 'success': return '#10b981' 
      case 'error': return '#ef4444'
    }
  }

  const getStatusIcon = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading': return '⏳'
      case 'success': return '✅'
      case 'error': return '❌'
    }
  }

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ 
        fontSize: '28px', 
        marginBottom: '30px',
        textAlign: 'center',
        color: '#1f2937'
      }}>
        TPlan Connection Test
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Kakao API Test */}
        <div style={{
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {getStatusIcon(kakaoStatus)} Kakao Maps API
          </h2>
          <div style={{
            padding: '12px',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            borderLeft: `4px solid ${getStatusColor(kakaoStatus)}`
          }}>
            <strong>Status:</strong> {kakaoStatus}<br/>
            <strong>Message:</strong> {kakaoMessage || 'Testing...'}
          </div>
        </div>

        {/* Supabase Test */}
        <div style={{
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {getStatusIcon(supabaseStatus)} Supabase Database
          </h2>
          <div style={{
            padding: '12px',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            borderLeft: `4px solid ${getStatusColor(supabaseStatus)}`
          }}>
            <strong>Status:</strong> {supabaseStatus}<br/>
            <strong>Message:</strong> {supabaseMessage || 'Testing...'}
            {needsTable && (
              <div style={{ marginTop: '12px' }}>
                <button
                  onClick={handleCreateTable}
                  disabled={creatingTable}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: creatingTable ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: creatingTable ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {creatingTable ? 'Creating Table...' : 'Create plan_boxes Table'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Environment Info */}
        <div style={{
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>
            📋 Environment Variables
          </h2>
          <div style={{
            padding: '12px',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}>
            <div><strong>KAKAO_API_KEY:</strong> {process.env.NEXT_PUBLIC_KAKAO_API_KEY ? '✓ Set' : '❌ Missing'}</div>
            <div><strong>SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '❌ Missing'}</div>
            <div><strong>SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '❌ Missing'}</div>
          </div>
        </div>

        {/* Manual SQL Instructions */}
        {needsTable && (
          <div style={{
            padding: '20px',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            backgroundColor: '#fef3c7'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '12px', color: '#92400e' }}>
              📝 Manual Table Creation (Alternative)
            </h2>
            <p style={{ marginBottom: '12px', color: '#92400e' }}>
              If the automatic creation fails, create the table manually in your Supabase dashboard:
            </p>
            <pre style={{
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              overflow: 'auto',
              border: '1px solid #d1d5db'
            }}>
{`CREATE TABLE plan_boxes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  startHour INTEGER,
  startMinute INTEGER,
  durationHour INTEGER NOT NULL DEFAULT 1,
  durationMinute INTEGER NOT NULL DEFAULT 0,
  hasTimeSet BOOLEAN DEFAULT false,
  memo TEXT,
  location TEXT,
  address TEXT,
  phone TEXT,
  cost NUMERIC,
  transportMode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
            </pre>
          </div>
        )}

        {/* Navigation */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a 
            href="/planner" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            Go to Planner
          </a>
        </div>
      </div>
    </div>
  )
}