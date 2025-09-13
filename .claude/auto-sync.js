#!/usr/bin/env node

/**
 * 🚀 지하↔1층 완전 자동 동기화 시스템
 *
 * 명령어 (초간단):
 * - s (start): 작업 시작 시 자동 pull & 상태 확인
 * - e (end): 작업 종료 시 자동 commit & push
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AutoSync {
  constructor() {
    this.location = os.hostname().includes('KGS2') ? '지하' : '1층';
    this.timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  }

  exec(cmd, silent = false) {
    try {
      const result = execSync(cmd, { encoding: 'utf8' });
      if (!silent) console.log(result.trim());
      return result;
    } catch (error) {
      if (!silent) console.log(`⚠️ ${cmd} 실행 중 오류:`, error.message);
      return null;
    }
  }

  // 작업 시작 (자동 pull & 상태 확인)
  start() {
    console.log(`\n🚀 ${this.location} 작업 시작 (${this.timestamp})\n`);

    // 1. Git pull
    console.log('📥 최신 코드 가져오는 중...');
    this.exec('git pull origin main');

    // 2. npm install (package.json 변경 확인)
    console.log('📦 패키지 확인...');
    this.exec('npm install', true);

    // 3. 현재 상태 확인
    const branch = this.exec('git branch --show-current', true)?.trim() || 'main';
    const status = this.exec('git status --short', true);
    const lastCommit = this.exec('git log -1 --oneline', true)?.trim();

    // 4. 상태 보고서 생성
    const report = `
# 🏢 ${this.location} Claude 작업 시작

## 📍 위치 정보
- **작업 위치**: ${this.location}
- **시작 시간**: ${this.timestamp}
- **컴퓨터**: ${os.hostname()}

## 📊 Git 상태
- **브랜치**: ${branch}
- **마지막 커밋**: ${lastCommit}
- **변경된 파일**: ${status ? status.split('\n').filter(l => l).length + '개' : '없음'}

## 🔧 주요 파일
- **메인 페이지**: src/app/planner/page.tsx
- **데이터베이스**: database/schema.sql
- **환경 설정**: .env.local

## 💡 빠른 명령어
\`\`\`bash
# 개발 서버
npm run dev

# 작업 종료 시
npm run e
\`\`\`
`;

    // 5. 상태는 콘솔에만 출력 (파일 생성하지 않음)
    console.log(report);

    // 6. 작업 로그 확인 (WORK_LOG.md)
    if (fs.existsSync('WORK_LOG.md')) {
      const workLog = fs.readFileSync('WORK_LOG.md', 'utf8');
      const lines = workLog.split('\n');
      // 마지막 작업 내역만 표시 (최근 20줄)
      const recentWork = lines.slice(-20).join('\n');
      if (recentWork.trim()) {
        console.log('\n📋 최근 작업 내역:');
        console.log(recentWork);
      }
    }

    console.log('\n✅ 준비 완료! 작업을 시작하세요.\n');
  }

  // 작업 종료 (자동 commit & push)
  end(message) {
    console.log(`\n🏁 ${this.location} 작업 종료 (${this.timestamp})\n`);

    // 1. 작업 로그 업데이트
    this.updateWorkLog(message);

    // 2. 현재 상태 확인
    const status = this.exec('git status --short', true);

    if (!status || status.trim() === '') {
      console.log('✅ 변경사항이 없습니다.');
      return;
    }

    // 3. 모든 변경사항 추가
    console.log('📝 변경사항 저장 중...');
    this.exec('git add -A');

    // 4. 커밋
    const workMessage = message || `${this.location} 작업 - ${this.timestamp}`;
    const commitMsg = `[${this.location}] ${workMessage}`;
    console.log(`💾 커밋: ${commitMsg}`);
    this.exec(`git commit -m "${commitMsg}"`);

    // 5. Push
    console.log('📤 원격 저장소에 푸시 중...');
    this.exec('git push origin main');

    console.log(`\n✅ ${this.location} 작업 완료 및 동기화됨!\n`);
    console.log('💡 다른 컴퓨터에서 "npm run s"로 시작하세요.\n');
  }

  // 작업 로그 업데이트
  updateWorkLog(message) {
    const logFile = 'WORK_LOG.md';
    let content = '';

    if (fs.existsSync(logFile)) {
      content = fs.readFileSync(logFile, 'utf8');
    } else {
      content = '# 📝 작업 로그 (자동 업데이트)\n\n---\n\n';
    }

    const date = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    const time = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const newEntry = `
## ${date}

### 🕐 ${time} - ${this.location}
**작업 내용**: ${message || '작업 종료'}

---
`;

    // 날짜가 이미 있으면 그 아래에 추가, 없으면 새로 추가
    if (content.includes(`## ${date}`)) {
      const dateIndex = content.indexOf(`## ${date}`);
      const nextDateIndex = content.indexOf('\n## ', dateIndex + 1);
      if (nextDateIndex === -1) {
        content += `\n### 🕐 ${time} - ${this.location}\n**작업 내용**: ${message || '작업 종료'}\n\n---\n`;
      } else {
        const before = content.substring(0, nextDateIndex);
        const after = content.substring(nextDateIndex);
        content = before + `\n### 🕐 ${time} - ${this.location}\n**작업 내용**: ${message || '작업 종료'}\n\n---\n` + after;
      }
    } else {
      content += newEntry;
    }

    fs.writeFileSync(logFile, content);
    console.log('📋 작업 로그 업데이트됨');
  }

  // 상태만 확인
  status() {
    const branch = this.exec('git branch --show-current', true)?.trim();
    const status = this.exec('git status --short', true);
    const ahead = this.exec('git rev-list --count origin/main..HEAD', true)?.trim();
    const behind = this.exec('git rev-list --count HEAD..origin/main', true)?.trim();

    console.log(`\n📊 현재 상태 (${this.location})`);
    console.log(`브랜치: ${branch}`);
    console.log(`로컬 변경: ${status ? status.split('\n').filter(l => l).length + '개' : '없음'}`);
    console.log(`푸시 대기: ${ahead || '0'}개 커밋`);
    console.log(`풀 대기: ${behind || '0'}개 커밋\n`);
  }
}

// CLI 실행
const sync = new AutoSync();
const command = process.argv[2];
const message = process.argv.slice(3).join(' ');

switch(command) {
  case 's':
  case 'start':
    sync.start();
    break;

  case 'e':
  case 'end':
    sync.end(message);
    break;

  case 'status':
    sync.status();
    break;

  default:
    console.log(`
🚀 지하↔1층 자동 동기화

사용법:
  npm run s         # 작업 시작 (자동 pull)
  npm run e         # 작업 종료 (자동 commit & push)
  npm run e "메시지" # 작업 종료 (메시지 포함)

현재 위치: ${sync.location}
`);
}