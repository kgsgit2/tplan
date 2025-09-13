# 🔄 환경 동기화 체크리스트

## 다른 컴퓨터에서 설정 확인

### ✅ Git 및 프로젝트
```bash
# 1. 프로젝트 클론/업데이트
git clone https://github.com/kgsgit2/tplan.git
# 또는: git pull origin main

# 2. 패키지 설치
npm install

# 3. 개발 서버 실행 테스트
npm run dev
```

### ✅ 환경변수 설정
```bash
# 1. 환경 파일 복사
cp .env.example .env.local

# 2. .env.local 수정 필요 항목:
# - NEXT_PUBLIC_KAKAO_API_KEY=실제_카카오_API_키
# - NEXT_PUBLIC_SUPABASE_URL=https://fsznctkjtakcvjuhrxpx.supabase.co
# - NEXT_PUBLIC_SUPABASE_ANON_KEY=실제_익명_키
```

### ✅ Supabase MCP 설정
```bash
# 1. MCP 서버 설치
npm install -g @supabase/mcp-server

# 2. Claude Desktop 설정 파일 위치:
# Windows: %APPDATA%\Claude\claude_desktop_config.json
# Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
```

### ✅ 데이터베이스 확인
1. `SETUP_DATABASE.md` 파일 확인
2. Supabase 프로젝트 URL: https://fsznctkjtakcvjuhrxpx.supabase.co
3. 이미 설정된 테이블들이 있는지 확인

### ✅ 기능 테스트
```bash
# 1. 개발 서버 실행
npm run dev

# 2. 브라우저에서 확인:
# - http://localhost:3000/planner (메인 기능)
# - http://localhost:3000/test-connection (DB 연결 테스트)
# - http://localhost:3000/setup-database (DB 설정)

# 3. 테스트 실행
npm run test:e2e
```

### ✅ MCP 도구 확인
Claude에서 다음 명령어들이 작동하는지 확인:
- `mcp__supabase__list_tables` ✓
- `mcp__supabase__execute_sql` ✓  
- `mcp__supabase__generate_typescript_types` ✓

## 🚨 주의사항

1. **환경변수**: `.env.local`은 .gitignore에 있으므로 수동으로 설정해야 함
2. **카카오 API**: 실제 카카오 개발자 키 필요
3. **Claude MCP**: Claude Desktop 재시작 후 MCP 도구 확인
4. **포트 설정**: 3000번 포트가 사용 중이면 다른 포트로 변경

## 📋 동일한 Supabase 프로젝트 사용

- **프로젝트 ID**: fsznctkjtakcvjuhrxpx
- **URL**: https://fsznctkjtakcvjuhrxpx.supabase.co  
- **모든 설정이 이미 완료**: 테이블, RLS 정책, 함수 등

두 컴퓨터에서 같은 데이터베이스를 공유하므로 데이터 동기화는 자동으로 됩니다!