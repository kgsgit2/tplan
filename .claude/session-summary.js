#!/usr/bin/env node

/**
 * 📝 Claude 세션 요약 도구
 * Claude가 작업 내용을 요약해서 WORK_LOG.md에 추가할 때 사용
 */

const fs = require('fs');
const path = require('path');

class SessionSummary {
  constructor() {
    this.workLogFile = 'WORK_LOG.md';
  }

  addSummary(title, tasks) {
    const now = new Date();
    const date = now.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    const time = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // 작업 요약 생성
    let summary = `\n### 🤖 Claude 세션 요약 - ${time}\n`;
    summary += `**제목**: ${title}\n\n`;
    summary += `**주요 작업**:\n`;

    tasks.forEach((task, index) => {
      summary += `${index + 1}. ${task}\n`;
    });

    summary += `\n---\n`;

    // WORK_LOG.md에 추가
    let content = '';
    if (fs.existsSync(this.workLogFile)) {
      content = fs.readFileSync(this.workLogFile, 'utf8');
    }

    // 날짜 섹션 찾기
    const dateHeader = `## ${date}`;
    if (!content.includes(dateHeader)) {
      content += `\n${dateHeader}\n`;
    }

    // 요약 추가
    content += summary;

    fs.writeFileSync(this.workLogFile, content);
    console.log('✅ 작업 요약이 WORK_LOG.md에 추가되었습니다.');
    console.log(summary);
  }
}

// CLI 사용
if (require.main === module) {
  const summary = new SessionSummary();

  // 예시 사용법
  if (process.argv[2] === 'example') {
    summary.addSummary(
      '지하↔1층 동기화 시스템 구축',
      [
        '자동 동기화 스크립트 개발',
        '파일 구조 정리',
        'GitHub 정리'
      ]
    );
  } else {
    console.log(`
📝 Claude 세션 요약 도구

사용법:
  node .claude/session-summary.js example

Claude가 프로그래밍 방식으로 사용:
  const SessionSummary = require('./session-summary.js');
  const summary = new SessionSummary();
  summary.addSummary('제목', ['작업1', '작업2']);
`);
  }
}

module.exports = SessionSummary;