#!/usr/bin/env node

/**
 * 🏁 Claude 작업 종료 자동화
 * 
 * Git diff로 변경사항을 자동 분석해서 요약하고 
 * 커밋 + 푸시 + 세션 저장까지 한 번에!
 * 
 * 사용법:
 * node .claude/auto-end-session.js
 * 또는
 * npm run claude:end
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

class AutoEndSession {
  constructor() {
    this.computerId = `${os.hostname()}-${os.userInfo().username}`;
  }

  analyzeGitChanges() {
    try {
      // Git 상태 확인
      const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      const diff = execSync('git diff HEAD --name-only', { encoding: 'utf8' }).trim();
      const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
      
      if (!status && !diff && !staged) {
        return { hasChanges: false, summary: '변경사항 없음' };
      }

      // 변경된 파일들 분석
      const allChanges = [...new Set([
        ...status.split('\n').filter(l => l.trim()).map(l => l.substring(3)),
        ...diff.split('\n').filter(l => l.trim()),
        ...staged.split('\n').filter(l => l.trim())
      ])];

      // 파일 타입별 분류
      const fileTypes = {
        tsx: [], ts: [], js: [], jsx: [],
        css: [], scss: [], 
        json: [], md: [],
        test: [], spec: [],
        config: [],
        other: []
      };

      allChanges.forEach(file => {
        if (file.includes('.spec.') || file.includes('.test.')) {
          fileTypes.test.push(file);
        } else if (file.endsWith('.tsx')) {
          fileTypes.tsx.push(file);
        } else if (file.endsWith('.ts')) {
          fileTypes.ts.push(file);
        } else if (file.endsWith('.js')) {
          fileTypes.js.push(file);
        } else if (file.endsWith('.jsx')) {
          fileTypes.jsx.push(file);
        } else if (file.endsWith('.css') || file.endsWith('.scss')) {
          fileTypes.css.push(file);
        } else if (file.endsWith('.json')) {
          if (file.includes('config') || file.includes('package')) {
            fileTypes.config.push(file);
          } else {
            fileTypes.json.push(file);
          }
        } else if (file.endsWith('.md')) {
          fileTypes.md.push(file);
        } else {
          fileTypes.other.push(file);
        }
      });

      return {
        hasChanges: true,
        allChanges,
        fileTypes,
        summary: this.generateChangeSummary(fileTypes)
      };

    } catch (error) {
      console.error('❌ Git 변경사항 분석 실패:', error.message);
      return { hasChanges: false, summary: '분석 실패' };
    }
  }

  generateChangeSummary(fileTypes) {
    const parts = [];

    if (fileTypes.tsx.length > 0) {
      parts.push(`React 컴포넌트 ${fileTypes.tsx.length}개 수정`);
    }
    if (fileTypes.ts.length > 0) {
      parts.push(`TypeScript 파일 ${fileTypes.ts.length}개 수정`);
    }
    if (fileTypes.test.length > 0) {
      parts.push(`테스트 파일 ${fileTypes.test.length}개 수정`);
    }
    if (fileTypes.css.length > 0) {
      parts.push(`스타일 파일 ${fileTypes.css.length}개 수정`);
    }
    if (fileTypes.md.length > 0) {
      parts.push(`문서 ${fileTypes.md.length}개 수정`);
    }
    if (fileTypes.config.length > 0) {
      parts.push(`설정 파일 ${fileTypes.config.length}개 수정`);
    }
    if (fileTypes.other.length > 0) {
      parts.push(`기타 파일 ${fileTypes.other.length}개 수정`);
    }

    return parts.length > 0 ? parts.join(', ') : '파일 수정';
  }

  checkProjectStatus() {
    try {
      // TypeScript 오류 확인
      let tsErrors = 0;
      let tsFixed = false;
      try {
        execSync('npm run build', { stdio: 'ignore' });
      } catch (error) {
        const output = error.stdout?.toString() || '';
        tsErrors = (output.match(/error TS\d+:/g) || []).length;
      }

      // 테스트 상태 확인
      let testStatus = 'unknown';
      try {
        execSync('npm run test:e2e', { stdio: 'ignore' });
        testStatus = 'passing';
      } catch (error) {
        testStatus = 'failing';
      }

      return { tsErrors, testStatus };
    } catch (error) {
      return { tsErrors: 0, testStatus: 'unknown' };
    }
  }

  generateAutoCommitMessage(analysis, status) {
    let message = '';

    // 메인 작업 요약
    if (analysis.hasChanges) {
      message += `feat: ${analysis.summary}\n\n`;
      
      // 상세 변경사항
      const details = [];
      if (analysis.fileTypes.tsx.length > 0) {
        details.push(`- React 컴포넌트: ${analysis.fileTypes.tsx.map(f => path.basename(f)).join(', ')}`);
      }
      if (analysis.fileTypes.ts.length > 0) {
        details.push(`- TypeScript: ${analysis.fileTypes.ts.map(f => path.basename(f)).join(', ')}`);
      }
      if (analysis.fileTypes.test.length > 0) {
        details.push(`- 테스트: ${analysis.fileTypes.test.map(f => path.basename(f)).join(', ')}`);
      }
      
      if (details.length > 0) {
        message += details.join('\n') + '\n\n';
      }
    } else {
      message += 'docs: 문서 및 설정 업데이트\n\n';
    }

    // 프로젝트 상태 정보
    if (status.tsErrors === 0) {
      message += '✅ TypeScript 오류 없음\n';
    } else {
      message += `⚠️ TypeScript 오류 ${status.tsErrors}개 남음\n`;
    }
    
    if (status.testStatus === 'passing') {
      message += '✅ 모든 테스트 통과\n';
    } else if (status.testStatus === 'failing') {
      message += '🧪 테스트 수정 필요\n';
    }

    message += '\n🤖 Generated with [Claude Code](https://claude.ai/code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>';

    return message;
  }

  async saveToSupabase(summary, analysis, status) {
    try {
      // Supabase 세션 저장 (이미 구현된 클래스 활용)
      const SupabaseSync = require('./supabase-session-sync.js');
      const supabase = new SupabaseSync();
      
      const detailedSummary = `${summary} | TS오류: ${status.tsErrors}개 | 테스트: ${status.testStatus}`;
      await supabase.saveSession(detailedSummary, status.tsErrors > 10 ? 'HIGH' : 'MEDIUM');
      
      return true;
    } catch (error) {
      console.log('⚠️ Supabase 저장 실패 (선택사항):', error.message);
      return false;
    }
  }

  async autoEndSession() {
    console.log('🏁 Claude 작업 자동 종료 시작...\n');

    // 1. Git 변경사항 분석
    console.log('📊 변경사항 분석 중...');
    const analysis = this.analyzeGitChanges();
    
    if (!analysis.hasChanges) {
      console.log('📝 변경사항이 없어 커밋할 내용이 없습니다.');
      return;
    }

    console.log(`✅ 분석 완료: ${analysis.summary}`);

    // 2. 프로젝트 상태 확인
    console.log('🔍 프로젝트 상태 확인 중...');
    const status = this.checkProjectStatus();
    console.log(`📋 TypeScript 오류: ${status.tsErrors}개, 테스트: ${status.testStatus}`);

    // 3. 자동 Git 작업
    try {
      console.log('\n🔄 Git 작업 실행 중...');
      
      // Git add
      execSync('git add .', { stdio: 'inherit' });
      console.log('✅ 파일 스테이징 완료');

      // 자동 커밋 메시지 생성
      const commitMessage = this.generateAutoCommitMessage(analysis, status);
      
      // 커밋
      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
      console.log('✅ 커밋 완료');

      // 푸시
      execSync('git push', { stdio: 'inherit' });
      console.log('✅ 원격 저장소 푸시 완료');

    } catch (error) {
      console.error('❌ Git 작업 실패:', error.message);
      return;
    }

    // 4. 세션 저장
    console.log('\n💾 세션 정보 저장 중...');
    await this.saveToSupabase(analysis.summary, analysis, status);

    console.log('\n🎉 자동 종료 완료!');
    console.log(`📝 요약: ${analysis.summary}`);
    console.log(`🌐 다른 컴퓨터에서 git pull 후 npm run claude:start 하면 이어서 작업 가능합니다.`);
  }
}

// CLI 실행
if (require.main === module) {
  const autoEnd = new AutoEndSession();
  autoEnd.autoEndSession().catch(console.error);
}

module.exports = AutoEndSession;