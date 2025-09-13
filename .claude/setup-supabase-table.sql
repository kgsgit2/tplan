-- Claude 세션 동기화를 위한 테이블 생성
CREATE TABLE IF NOT EXISTS claude_sessions (
  id SERIAL PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  computer_id VARCHAR(255) NOT NULL,
  session_data JSONB NOT NULL,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 추가
CREATE INDEX idx_claude_sessions_project ON claude_sessions(project_name);
CREATE INDEX idx_claude_sessions_computer ON claude_sessions(computer_id);
CREATE INDEX idx_claude_sessions_created ON claude_sessions(created_at DESC);

-- RLS (Row Level Security) 설정
ALTER TABLE claude_sessions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 설정
CREATE POLICY "Enable read access for all users" ON claude_sessions
  FOR SELECT USING (true);

-- 모든 사용자가 삽입할 수 있도록 정책 설정  
CREATE POLICY "Enable insert for all users" ON claude_sessions
  FOR INSERT WITH CHECK (true);

-- 업데이트 트리거 설정
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_claude_sessions_updated_at BEFORE UPDATE
  ON claude_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();