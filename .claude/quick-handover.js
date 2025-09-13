#!/usr/bin/env node

/**
 * 🚀 간단한 Claude 인수인계 시스템
 * 타임아웃 없이 빠르게 작동하는 버전
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class QuickHandover {
  constructor() {
    this.outputFile = path.join(__dirname, '..', 'CLAUDE_STATUS.md');
  }

  getGitStatus() {
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const status = execSync('git status --short', { encoding: 'utf8' });
      const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf8' }).trim();

      return {
        branch,
        hasChanges: status.length > 0,
        changedFiles: status.split('\n').filter(l => l).length,
        lastCommit
      };
    } catch (e) {
      return { branch: 'unknown', hasChanges: false, changedFiles: 0, lastCommit: 'N/A' };
    }
  }

  getTypeScriptErrors() {
    try {
      // 타임아웃 설정 추가 (5초)
      const result = execSync('npm run type-check 2>&1', {
        encoding: 'utf8',
        timeout: 5000
      });
      const errorMatch = result.match(/(\d+) errors?/);
      return errorMatch ? parseInt(errorMatch[1]) : 0;
    } catch (e) {
      // 타임아웃이나 에러 발생 시
      if (e.stdout) {
        const errorMatch = e.stdout.match(/(\d+) errors?/);
        return errorMatch ? parseInt(errorMatch[1]) : 'Check manually';
      }
      return 'Check manually';
    }
  }

  getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  generateHandoverReport() {
    console.log('📊 상태 수집 중...');

    const git = this.getGitStatus();
    const tsErrors = this.getTypeScriptErrors();
    const dateTime = this.getCurrentDateTime();

    const report = `# 🤖 Claude 인수인계 현황

## 📅 정보
- **날짜/시간**: ${dateTime}
- **프로젝트**: TravelPlan (tplan)

## 📊 Git 상태
- **현재 브랜치**: ${git.branch}
- **변경된 파일**: ${git.changedFiles}개
- **마지막 커밋**: ${git.lastCommit}

## 🔧 프로젝트 상태
- **TypeScript 오류**: ${tsErrors === 'Unknown' ? '확인 필요' : `${tsErrors}개`}
- **개발 서버**: http://localhost:3000/planner

## 🎯 주요 파일 위치
- **메인 페이지**: src/app/planner/page.tsx
- **데이터베이스 스키마**: database/schema.sql
- **환경 설정**: .env.local

## 📝 작업 노트
(여기에 현재 작업 상태를 추가하세요)

## 🚀 빠른 시작
\`\`\`bash
# 개발 서버 시작
npm run dev

# 타입 체크
npm run type-check

# 테스트 실행
npm test
\`\`\`

---
*생성 시간: ${dateTime}*
`;

    return report;
  }

  save(message) {
    const report = this.generateHandoverReport();
    const updatedReport = message
      ? report.replace('(여기에 현재 작업 상태를 추가하세요)', message)
      : report;

    fs.writeFileSync(this.outputFile, updatedReport);
    console.log(`✅ 인수인계 정보 저장됨: ${this.outputFile}`);
  }

  load() {
    if (fs.existsSync(this.outputFile)) {
      const content = fs.readFileSync(this.outputFile, 'utf8');
      console.log('\n' + content);
    } else {
      console.log('❌ 저장된 인수인계 정보가 없습니다.');
      console.log('💡 먼저 "npm run claude:quick-save"를 실행하세요.');
    }
  }
}

// CLI 실행
const handover = new QuickHandover();
const command = process.argv[2];
const message = process.argv.slice(3).join(' ');

switch(command) {
  case 'save':
    handover.save(message);
    break;
  case 'load':
  case 'start':
    handover.load();
    break;
  default:
    const report = handover.generateHandoverReport();
    console.log(report);
}