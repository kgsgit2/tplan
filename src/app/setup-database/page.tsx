'use client'

import { useState } from 'react'

export default function SetupDatabasePage() {
  const [copied, setCopied] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const sql = `-- TPlan Database Schema Creation
-- Execute this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create simple plan_boxes table for immediate use
CREATE TABLE IF NOT EXISTS plan_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  start_hour INTEGER,
  start_minute INTEGER,
  duration_hour INTEGER NOT NULL DEFAULT 1,
  duration_minute INTEGER NOT NULL DEFAULT 0,
  has_time_set BOOLEAN DEFAULT false,
  memo TEXT,
  location_name TEXT,
  address TEXT,
  phone TEXT,
  estimated_cost DECIMAL(10,2),
  transport_mode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_plan_boxes_category ON plan_boxes(category);
CREATE INDEX IF NOT EXISTS idx_plan_boxes_created_at ON plan_boxes(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE plan_boxes ENABLE ROW LEVEL SECURITY;

-- Create development policy (allow all operations)
CREATE POLICY "Allow all operations for development" ON plan_boxes 
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON plan_boxes TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Insert sample data
INSERT INTO plan_boxes (title, category, start_hour, start_minute, duration_hour, duration_minute, has_time_set, location_name, address, memo, estimated_cost) VALUES
  ('경복궁 관람', 'sightseeing', 10, 0, 2, 0, true, '경복궁', '서울특별시 종로구 사직로 161', '한국의 대표적인 궁궐', 3000),
  ('명동 쇼핑', 'shopping', 14, 0, 1, 30, true, '명동', '서울특별시 중구 명동', '서울 중심가 쇼핑', 100000),
  ('점심식사', 'food', 12, 30, 1, 0, true, '전통 한정식집', null, '한식 전문점, 미리 예약 완료', 25000);`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/test-supabase')
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, message: 'Connection test failed' })
    }
    setTesting(false)
  }

  const openSupabase = () => {
    window.open('https://fsznctkjtakcvjuhrxpx.supabase.co', '_blank')
  }

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '900px',
      margin: '0 auto'
    }}>
      <h1 style={{ 
        fontSize: '32px', 
        marginBottom: '30px',
        textAlign: 'center',
        color: '#1f2937',
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        🚀 TPlan Database Setup
      </h1>

      <div style={{
        padding: '30px',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        backgroundColor: '#f8fafc',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#1f2937' }}>
          📋 설정 단계
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #d1d5db'
          }}>
            <span style={{ fontSize: '20px', marginRight: '12px' }}>1️⃣</span>
            <span style={{ flex: 1, fontSize: '16px' }}>Supabase 대시보드 열기</span>
            <button
              onClick={openSupabase}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              대시보드 열기
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #d1d5db'
          }}>
            <span style={{ fontSize: '20px', marginRight: '12px' }}>2️⃣</span>
            <span style={{ fontSize: '16px' }}>왼쪽 메뉴에서 'SQL Editor' 클릭</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #d1d5db'
          }}>
            <span style={{ fontSize: '20px', marginRight: '12px' }}>3️⃣</span>
            <span style={{ flex: 1, fontSize: '16px' }}>아래 SQL 복사해서 실행</span>
            <button
              onClick={copyToClipboard}
              style={{
                padding: '8px 16px',
                backgroundColor: copied ? '#10b981' : '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {copied ? '✓ 복사됨' : 'SQL 복사'}
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #d1d5db'
          }}>
            <span style={{ fontSize: '20px', marginRight: '12px' }}>4️⃣</span>
            <span style={{ flex: 1, fontSize: '16px' }}>SQL 실행 후 아래 버튼으로 테스트</span>
            <button
              onClick={testConnection}
              disabled={testing}
              style={{
                padding: '8px 16px',
                backgroundColor: testing ? '#9ca3af' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: testing ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {testing ? '테스트 중...' : '연결 테스트'}
            </button>
          </div>
        </div>
      </div>

      {/* SQL Code Box */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        marginBottom: '30px'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          marginBottom: '15px',
          color: '#f1f5f9'
        }}>
          💾 실행할 SQL 코드:
        </h3>
        <pre style={{
          backgroundColor: '#0f172a',
          padding: '20px',
          borderRadius: '8px',
          fontSize: '13px',
          fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
          color: '#e2e8f0',
          overflow: 'auto',
          maxHeight: '400px',
          border: '1px solid #475569'
        }}>
          {sql}
        </pre>
      </div>

      {/* Test Results */}
      {testResult && (
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: testResult.success ? '#dcfce7' : '#fef2f2',
          border: `2px solid ${testResult.success ? '#16a34a' : '#dc2626'}`,
          marginBottom: '30px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            marginBottom: '10px',
            color: testResult.success ? '#15803d' : '#dc2626'
          }}>
            {testResult.success ? '✅ 테스트 성공!' : '❌ 테스트 실패'}
          </h3>
          <p style={{ 
            fontSize: '14px',
            color: testResult.success ? '#166534' : '#991b1b'
          }}>
            {testResult.message}
          </p>
          {testResult.success && (
            <div style={{ marginTop: '15px' }}>
              <a 
                href="/planner" 
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                🎉 플래너 시작하기
              </a>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <a 
          href="/test-connection" 
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#6b7280',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            marginRight: '10px'
          }}
        >
          연결 테스트 페이지로
        </a>
        <a 
          href="/" 
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#374151',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  )
}