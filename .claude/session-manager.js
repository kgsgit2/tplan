#!/usr/bin/env node

/**
 * 🤖 Claude 세션 자동 연속성 매니저
 * 
 * 사용법:
 * - 작업 시작: node .claude/session-manager.js start
 * - 작업 종료: node .claude/session-manager.js end "작업 요약"
 * - 상태 확인: node .claude/session-manager.js status
 * - 새 세션: node .claude/session-manager.js handover
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SESSION_FILE = path.join(__dirname, 'current-session.json');
const LOG_FILE = path.join(__dirname, 'session-history.log');

class ClaudeSessionManager {
  constructor() {
    this.ensureFiles();
  }

  ensureFiles() {
    if (!fs.existsSync(__dirname)) {
      fs.mkdirSync(__dirname, { recursive: true });
    }
  }

  getCurrentStatus() {
    try {
      // Git 상태
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      const gitBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const gitCommits = execSync('git log --oneline -5', { encoding: 'utf8' }).trim();

      // TypeScript 오류 수
      let tsErrors = 0;
      try {
        execSync('npm run build', { stdio: 'ignore' });
      } catch (error) {
        const output = error.stdout?.toString() || '';
        tsErrors = (output.match(/error TS\d+:/g) || []).length;
      }

      // 테스트 상태
      let testStatus = 'unknown';
      try {
        const testResult = execSync('npm run test:e2e', { encoding: 'utf8', stdio: 'ignore' });
        testStatus = 'passing';
      } catch (error) {
        testStatus = 'failing';
      }

      // 패키지 정보
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

      return {
        timestamp: new Date().toISOString(),
        git: {
          branch: gitBranch,
          status: gitStatus,
          recentCommits: gitCommits.split('\n'),
          hasChanges: gitStatus.length > 0
        },
        project: {
          name: packageJson.name,
          version: packageJson.version,
          tsErrors: tsErrors,
          testStatus: testStatus
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform
        }
      };
    } catch (error) {
      console.error('❌ 상태 확인 중 오류:', error.message);
      return null;
    }
  }

  saveSession(data) {
    const session = {
      ...data,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
    
    // 히스토리에도 로그
    const logEntry = `${session.timestamp}: ${data.summary || 'Session saved'}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
  }

  loadSession() {
    if (!fs.existsSync(SESSION_FILE)) {
      return null;
    }
    
    try {
      return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    } catch (error) {
      console.error('❌ 세션 파일 로드 오류:', error.message);
      return null;
    }
  }

  generateHandoverPrompt() {
    const status = this.getCurrentStatus();
    const lastSession = this.loadSession();
    
    if (!status) return '❌ 상태 확인 실패';

    let prompt = `# 🤖 자동 Claude 세션 인수인계

## 📊 현재 프로젝트 상태 (${new Date().toLocaleString()})

### Git 상태
- **브랜치**: ${status.git.branch}
- **변경사항**: ${status.git.hasChanges ? '있음' : '없음'}
${status.git.hasChanges ? `\`\`\`\n${status.git.status}\n\`\`\`` : ''}

### 최근 커밋 (5개)
\`\`\`
${status.git.recentCommits.join('\n')}
\`\`\`

### 프로젝트 상태
- **TypeScript 오류**: ${status.project.tsErrors}개
- **테스트 상태**: ${status.project.testStatus}
- **Node.js**: ${status.environment.nodeVersion}

`;

    if (lastSession) {
      const timeDiff = Math.round((new Date() - new Date(lastSession.timestamp)) / (1000 * 60)); // 분 단위
      
      prompt += `### 이전 세션 정보
- **마지막 작업**: ${timeDiff}분 전
- **작업 내용**: ${lastSession.summary || '기록 없음'}
- **우선순위**: ${lastSession.priority || 'MEDIUM'}
- **진행률**: ${lastSession.progress || '알 수 없음'}

`;
    }

    prompt += `## 🎯 권장 다음 작업

${status.project.tsErrors > 0 ? 
`1. **TypeScript 오류 수정** (HIGH 우선순위)
   - \`tplan-refactoring-specialist\` Agent 활용 추천
   - ${status.project.tsErrors}개 오류 해결 필요` : 
'1. **코드 품질 개선** (MEDIUM 우선순위)'}

${status.project.testStatus === 'failing' ? 
`2. **테스트 수정** (HIGH 우선순위)
   - \`travel-planner-test-engineer\` Agent 활용 추천` : 
'2. **새 기능 개발** (LOW 우선순위)'}

## 💡 바로 사용할 수 있는 명령어
\`\`\`bash
npm run dev          # 개발 서버 실행
npm run build        # TypeScript 오류 확인
npm run test:e2e     # 테스트 실행
\`\`\`

---
*자동 생성됨 by Claude Session Manager*`;

    return prompt;
  }

  // CLI 명령어 처리
  handleCommand(command, ...args) {
    switch (command) {
      case 'start':
        console.log('🚀 Claude 세션 시작');
        const startStatus = this.getCurrentStatus();
        this.saveSession({
          type: 'start',
          summary: 'Session started',
          status: startStatus
        });
        console.log('✅ 세션 상태 저장됨');
        break;

      case 'end':
        const summary = args.join(' ') || '작업 완료';
        console.log(`🏁 Claude 세션 종료: ${summary}`);
        const endStatus = this.getCurrentStatus();
        this.saveSession({
          type: 'end',
          summary: summary,
          status: endStatus
        });
        console.log('✅ 세션 상태 저장됨');
        break;

      case 'status':
        const status = this.getCurrentStatus();
        console.log(JSON.stringify(status, null, 2));
        break;

      case 'handover':
        const prompt = this.generateHandoverPrompt();
        console.log('\n' + prompt);
        // 클립보드에 복사 (선택사항)
        break;

      default:
        console.log(`
사용법:
  node .claude/session-manager.js start                    # 세션 시작
  node .claude/session-manager.js end "작업 완료 설명"      # 세션 종료  
  node .claude/session-manager.js status                   # 현재 상태
  node .claude/session-manager.js handover                # 인수인계 프롬프트 생성
        `);
    }
  }
}

// CLI 실행
if (require.main === module) {
  const manager = new ClaudeSessionManager();
  const [,, command, ...args] = process.argv;
  manager.handleCommand(command, ...args);
}

module.exports = ClaudeSessionManager;