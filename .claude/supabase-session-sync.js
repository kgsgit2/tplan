#!/usr/bin/env node

/**
 * 🔄 Supabase 실시간 Claude 세션 동기화
 * 
 * 이미 구축된 Supabase를 활용해 실시간 세션 동기화
 */

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const os = require('os');

class SupabaseSessionSync {
  constructor() {
    // 이미 설정된 Supabase 프로젝트 활용
    this.supabase = createClient(
      'https://fsznctkjtakcvjuhrxpx.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem5jdGtqdGFrY3ZqdWhyeHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Njg0NjYsImV4cCI6MjA3MzI0NDQ2Nn0.wRBScmlbqDr4qL634jP019zPlwIzS5BkruE6XB9FMUo'
    );
    this.computerId = `${os.hostname()}-${os.userInfo().username}`;
    this.tableName = 'claude_sessions';
  }

  async ensureTable() {
    // claude_sessions 테이블이 없으면 생성
    const { error } = await this.supabase
      .from(this.tableName)
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') { // 테이블 없음
      console.log('📝 claude_sessions 테이블 생성 중...');
      // MCP를 통해 테이블 생성하거나 SQL 직접 실행
      const createTableSQL = `
CREATE TABLE IF NOT EXISTS claude_sessions (
  id SERIAL PRIMARY KEY,
  computer_id TEXT NOT NULL,
  session_data JSONB NOT NULL,
  summary TEXT,
  priority TEXT DEFAULT 'MEDIUM',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claude_sessions_computer_id ON claude_sessions(computer_id);
CREATE INDEX IF NOT EXISTS idx_claude_sessions_created_at ON claude_sessions(created_at DESC);
      `;
      
      // SQL 실행 (MCP 도구 활용 시)
      console.log('⚠️  Supabase Dashboard에서 다음 SQL을 실행하세요:');
      console.log(createTableSQL);
    }
  }

  async getCurrentStatus() {
    try {
      // Git 상태 확인 (로컬)
      const gitBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      
      // TypeScript 오류
      let tsErrors = 0;
      try {
        execSync('npm run build', { stdio: 'ignore' });
      } catch (error) {
        const output = error.stdout?.toString() || '';
        tsErrors = (output.match(/error TS\d+:/g) || []).length;
      }

      return {
        computer_id: this.computerId,
        git: {
          branch: gitBranch,
          hasChanges: gitStatus.length > 0,
          status: gitStatus
        },
        project: {
          tsErrors,
          timestamp: new Date().toISOString()
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform
        }
      };
    } catch (error) {
      console.error('❌ 상태 확인 실패:', error.message);
      return null;
    }
  }

  async saveSession(summary, priority = 'MEDIUM') {
    const status = await this.getCurrentStatus();
    if (!status) return false;

    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert([{
          computer_id: this.computerId,
          session_data: status,
          summary,
          priority
        }]);

      if (error) {
        console.error('❌ Supabase 저장 실패:', error);
        return false;
      }

      console.log(`✅ 세션 저장 완료 (Supabase)`);
      console.log(`🌐 다른 컴퓨터에서 실시간 접근 가능`);
      return true;

    } catch (error) {
      console.error('❌ 세션 저장 실패:', error.message);
      return false;
    }
  }

  async getLatestSession() {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('❌ 세션 로드 실패:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ 세션 로드 실패:', error.message);
      return null;
    }
  }

  async getAllSessions(limit = 5) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ 세션 목록 로드 실패:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ 세션 목록 로드 실패:', error.message);
      return [];
    }
  }

  async generateHandoverPrompt() {
    const currentStatus = await this.getCurrentStatus();
    const sessions = await this.getAllSessions(3);

    if (!currentStatus) {
      return '❌ 현재 상태 확인 실패';
    }

    const latestSession = sessions[0];
    
    let prompt = `# 🤖 Supabase 실시간 Claude 세션 인수인계

## 💻 현재 환경
- **컴퓨터**: ${currentStatus.computer_id}  
- **시간**: ${new Date().toLocaleString()}
- **Git 브랜치**: ${currentStatus.git.branch}

## 📊 실시간 프로젝트 상태
- **TypeScript 오류**: ${currentStatus.project.tsErrors}개
- **Git 변경사항**: ${currentStatus.git.hasChanges ? '있음' : '없음'}
`;

    if (latestSession) {
      const timeDiff = Math.round((new Date() - new Date(latestSession.created_at)) / (1000 * 60));
      const isFromDifferentComputer = latestSession.computer_id !== this.computerId;
      
      prompt += `
## 📝 최신 세션 정보 (Supabase)
- **마지막 작업**: ${timeDiff}분 전
- **작업한 컴퓨터**: ${latestSession.computer_id} ${isFromDifferentComputer ? '🌐 다른 컴퓨터' : '💻 같은 컴퓨터'}
- **작업 내용**: ${latestSession.summary}
- **우선순위**: ${latestSession.priority}

### 이전 상태와 비교:
- **TypeScript 오류**: ${latestSession.session_data.project.tsErrors}개 → ${currentStatus.project.tsErrors}개 ${currentStatus.project.tsErrors < latestSession.session_data.project.tsErrors ? '✅ 개선' : currentStatus.project.tsErrors > latestSession.session_data.project.tsErrors ? '❌ 악화' : '🔄 동일'}
`;
    }

    if (sessions.length > 1) {
      prompt += `\n## 📈 최근 작업 히스토리:\n`;
      sessions.slice(1, 3).forEach((session, index) => {
        const time = new Date(session.created_at).toLocaleString();
        prompt += `${index + 2}. **${time}** (${session.computer_id}): ${session.summary}\n`;
      });
    }

    prompt += `
## 🎯 AI 추천 다음 작업

${currentStatus.project.tsErrors > 0 ? 
`1. **TypeScript 오류 수정** (HIGH 우선순위)
   - \`tplan-refactoring-specialist\` Agent 활용 추천` : 
'1. **코드 품질 개선** (MEDIUM 우선순위)'}

## 💡 Supabase 세션 관리 명령어
\`\`\`bash
node .claude/supabase-session-sync.js save "작업 내용"    # 실시간 저장
node .claude/supabase-session-sync.js handover           # 인수인계 정보
node .claude/supabase-session-sync.js history           # 작업 히스토리
\`\`\`

---
*🔄 Supabase 실시간 동기화 (https://fsznctkjtakcvjuhrxpx.supabase.co)*`;

    return prompt;
  }

  async handleCommand(command, ...args) {
    await this.ensureTable();

    switch (command) {
      case 'save':
        const summary = args.join(' ') || '작업 진행 상황 저장';
        await this.saveSession(summary);
        break;

      case 'load':
        const session = await this.getLatestSession();
        if (session) {
          console.log('\n📋 최신 세션 (Supabase):');
          console.log(JSON.stringify(session, null, 2));
        } else {
          console.log('❌ 로드할 세션이 없습니다');
        }
        break;

      case 'handover':
        const prompt = await this.generateHandoverPrompt();
        console.log('\n' + prompt);
        break;

      case 'history':
        const sessions = await this.getAllSessions(10);
        console.log('\n📈 작업 히스토리:');
        sessions.forEach((session, index) => {
          const time = new Date(session.created_at).toLocaleString();
          console.log(`${index + 1}. [${time}] ${session.computer_id}: ${session.summary}`);
        });
        break;

      default:
        console.log(`
🔄 Supabase 실시간 Claude 세션 동기화

사용법:
  node .claude/supabase-session-sync.js save "작업 내용"     # Supabase에 실시간 저장
  node .claude/supabase-session-sync.js handover           # 인수인계 프롬프트 생성
  node .claude/supabase-session-sync.js history           # 모든 컴퓨터 작업 히스토리
  node .claude/supabase-session-sync.js load              # 최신 세션 로드

💡 실시간 동기화: 다른 컴퓨터에서 즉시 확인 가능
💡 작업 히스토리: 모든 컴퓨터의 작업 내역 추적
        `);
    }
  }
}

// CLI 실행
if (require.main === module) {
  const sync = new SupabaseSessionSync();
  const [,, command, ...args] = process.argv;
  sync.handleCommand(command, ...args);
}

module.exports = SupabaseSessionSync;