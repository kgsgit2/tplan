#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

class SimpleCommands {
  constructor() {
    this.computerID = `${os.hostname()}-${os.userInfo().username}`;
    this.sessionFile = path.join(__dirname, 'session.json');
  }

  // 시작 명령어 (s)
  start() {
    console.log('\n🚀 Claude 작업 시작!\n');
    console.log('='*50);
    
    try {
      // Git 상태
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const changes = execSync('git status --short', { encoding: 'utf8' });
      
      // TypeScript 오류 체크
      let tsErrors = 0;
      try {
        execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
      } catch (e) {
        const output = e.stdout || e.stderr || '';
        tsErrors = (output.match(/error TS/g) || []).length;
      }
      
      // 이전 세션 정보
      let previousWork = null;
      if (fs.existsSync(this.sessionFile)) {
        const session = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
        if (session.lastWork) {
          previousWork = session.lastWork;
        }
      }
      
      // 상태 출력
      console.log(`📍 브랜치: ${branch}`);
      console.log(`🔧 TypeScript 오류: ${tsErrors}개`);
      console.log(`📝 Git 변경: ${changes ? '있음' : '없음'}`);
      
      if (previousWork) {
        const timeDiff = Math.round((Date.now() - new Date(previousWork.timestamp)) / 60000);
        console.log(`\n📌 이전 작업 (${timeDiff}분 전):`);
        console.log(`   컴퓨터: ${previousWork.computer}`);
        console.log(`   내용: ${previousWork.message}`);
        
        if (previousWork.computer !== this.computerID) {
          console.log(`   ⚠️ 다른 컴퓨터에서 작업했습니다!`);
        }
      }
      
      // 권장사항
      console.log('\n💡 다음 작업:');
      if (tsErrors > 0) {
        console.log(`   1. TypeScript 오류 ${tsErrors}개 수정`);
      }
      if (changes) {
        console.log(`   2. 변경사항 확인 후 커밋 고려`);
      }
      
      console.log('\n✅ 준비 완료! 작업을 시작하세요.\n');
      
    } catch (error) {
      console.error('⚠️ 오류:', error.message);
    }
  }

  // 종료 명령어 (e)
  end(message) {
    console.log('\n🏁 Claude 작업 종료 중...\n');
    
    try {
      // 현재 상태 저장
      const status = {
        timestamp: new Date().toISOString(),
        computer: this.computerID,
        message: message || '작업 종료',
        git: {
          branch: execSync('git branch --show-current', { encoding: 'utf8' }).trim(),
          hasChanges: execSync('git status --short', { encoding: 'utf8' }).length > 0
        }
      };
      
      // TypeScript 오류 수
      try {
        execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
        status.typescript = { errors: 0 };
      } catch (e) {
        const output = e.stdout || e.stderr || '';
        status.typescript = { errors: (output.match(/error TS/g) || []).length };
      }
      
      // 세션 파일 업데이트
      let sessionData = {};
      if (fs.existsSync(this.sessionFile)) {
        sessionData = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
      }
      
      sessionData.lastWork = status;
      fs.writeFileSync(this.sessionFile, JSON.stringify(sessionData, null, 2));
      
      // 결과 출력
      console.log('📊 작업 요약:');
      console.log(`   브랜치: ${status.git.branch}`);
      console.log(`   TypeScript 오류: ${status.typescript.errors}개`);
      console.log(`   Git 변경: ${status.git.hasChanges ? '있음' : '없음'}`);
      
      if (message) {
        console.log(`   메모: ${message}`);
      }
      
      // Git 추가
      try {
        execSync('git add .claude/session.json', { stdio: 'pipe' });
        console.log('\n💾 세션 정보가 Git에 추가되었습니다.');
        console.log('   커밋과 푸시를 잊지 마세요!');
      } catch (e) {
        // Git 추가 실패는 무시
      }
      
      console.log('\n👋 수고하셨습니다! 다음 Claude가 이어서 작업할 수 있습니다.\n');
      
    } catch (error) {
      console.error('⚠️ 오류:', error.message);
    }
  }
}

// CLI 실행
const cmd = new SimpleCommands();
const command = process.argv[2];
const message = process.argv.slice(3).join(' ');

switch (command) {
  case 's':
  case 'start':
    cmd.start();
    break;
  case 'e':
  case 'end':
    cmd.end(message);
    break;
  default:
    console.log('사용법:');
    console.log('  npm run c:s     - 작업 시작');
    console.log('  npm run c:e     - 작업 종료');
    console.log('  npm run c:e "메시지"  - 메시지와 함께 종료');
}