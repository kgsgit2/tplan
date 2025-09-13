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
    this.statusFile = 'CLAUDE_STATUS.md';
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

    // 5. 상태 파일 저장
    fs.writeFileSync(this.statusFile, report);
    console.log(report);

    // 6. 이전 작업 내역 확인
    if (fs.existsSync('LAST_WORK.md')) {
      console.log('\n📋 이전 작업 내역:');
      console.log(fs.readFileSync('LAST_WORK.md', 'utf8'));
    }

    console.log('\n✅ 준비 완료! 작업을 시작하세요.\n');
  }

  // 작업 종료 (자동 commit & push)
  end(message) {
    console.log(`\n🏁 ${this.location} 작업 종료 (${this.timestamp})\n`);

    // 1. 현재 상태 확인
    const status = this.exec('git status --short', true);

    if (!status || status.trim() === '') {
      console.log('✅ 변경사항이 없습니다.');
      return;
    }

    // 2. 모든 변경사항 추가
    console.log('📝 변경사항 저장 중...');
    this.exec('git add -A');

    // 3. 작업 내역 저장
    const workMessage = message || `${this.location} 작업 - ${this.timestamp}`;
    fs.writeFileSync('LAST_WORK.md', `# 마지막 작업\n\n- **위치**: ${this.location}\n- **시간**: ${this.timestamp}\n- **내용**: ${workMessage}\n`);

    // 4. 커밋
    const commitMsg = `[${this.location}] ${workMessage}`;
    console.log(`💾 커밋: ${commitMsg}`);
    this.exec(`git commit -m "${commitMsg}"`);

    // 5. Push
    console.log('📤 원격 저장소에 푸시 중...');
    this.exec('git push origin main');

    console.log(`\n✅ ${this.location} 작업 완료 및 동기화됨!\n`);
    console.log('💡 다른 컴퓨터에서 "npm run s"로 시작하세요.\n');
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