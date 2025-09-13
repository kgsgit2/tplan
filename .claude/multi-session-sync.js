#!/usr/bin/env node

/**
 * 🌐 다중 컴퓨터 Claude 세션 동기화 매니저
 * 
 * GitHub를 통해 여러 컴퓨터간 Claude 세션 상태를 동기화
 * 
 * 사용법:
 * - 세션 저장: node .claude/multi-session-sync.js save "작업 내용"
 * - 세션 로드: node .claude/multi-session-sync.js load  
 * - 인수인계: node .claude/multi-session-sync.js handover
 * - 동기화: node .claude/multi-session-sync.js sync
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

class MultiComputerSessionSync {
  constructor() {
    this.sessionBranch = 'claude-sessions';
    this.sessionDir = '.claude-sessions';
    this.computerId = this.getComputerId();
  }

  getComputerId() {
    // 컴퓨터 고유 식별자 생성 (호스트명 + 사용자명)
    return `${os.hostname()}-${os.userInfo().username}`;
  }

  getCurrentTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  getSessionFileName() {
    return `${this.computerId}-${this.getCurrentTimestamp()}.json`;
  }

  getLatestSessionFile() {
    if (!fs.existsSync(this.sessionDir)) return null;
    
    const files = fs.readdirSync(this.sessionDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();
    
    return files.length > 0 ? path.join(this.sessionDir, files[0]) : null;
  }

  getCurrentProjectStatus() {
    try {
      // Git 상태
      const gitBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      const gitLog = execSync('git log --oneline -3', { encoding: 'utf8' }).trim();

      // TypeScript 오류 확인
      let tsErrors = 0;
      try {
        execSync('npm run build', { stdio: 'ignore' });
      } catch (error) {
        const output = error.stdout?.toString() || '';
        tsErrors = (output.match(/error TS\d+:/g) || []).length;
      }

      // 테스트 상태 확인  
      let testStatus = 'unknown';
      try {
        execSync('npm run test:e2e -- --reporter=dot', { stdio: 'ignore' });
        testStatus = 'passing';
      } catch (error) {
        testStatus = 'failing';
      }

      return {
        git: {
          branch: gitBranch,
          hasChanges: gitStatus.length > 0,
          changedFiles: gitStatus.split('\n').filter(line => line.trim()),
          recentCommits: gitLog.split('\n')
        },
        project: {
          tsErrors,
          testStatus
        },
        system: {
          computerId: this.computerId,
          nodeVersion: process.version,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ 프로젝트 상태 확인 실패:', error.message);
      return null;
    }
  }

  ensureSessionBranch() {
    try {
      // claude-sessions 브랜치가 있는지 확인
      execSync(`git show-ref --verify --quiet refs/heads/${this.sessionBranch}`, { stdio: 'ignore' });
    } catch (error) {
      // 브랜치가 없으면 생성
      console.log(`📝 ${this.sessionBranch} 브랜치 생성 중...`);
      execSync(`git checkout -b ${this.sessionBranch}`);
      
      // .gitignore에 일반 파일들 추가 (세션 파일만 트래킹)
      const gitignore = `# Claude Sessions Branch - Only track session files
*
!.claude-sessions/
!.claude-sessions/*.json
`;
      fs.writeFileSync('.gitignore', gitignore);
      
      if (!fs.existsSync(this.sessionDir)) {
        fs.mkdirSync(this.sessionDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(this.sessionDir, 'README.md'), 
`# Claude Sessions

이 브랜치는 다중 컴퓨터간 Claude 세션 동기화를 위한 전용 브랜치입니다.

- 각 컴퓨터의 작업 상태가 JSON 파일로 저장됩니다
- 컴퓨터간 작업 연속성을 보장합니다
- 자동으로 관리되므로 수동 편집하지 마세요
`);

      execSync('git add .');
      execSync('git commit -m "feat: Claude 다중 컴퓨터 세션 동기화 브랜치 초기화"');
      execSync(`git push -u origin ${this.sessionBranch}`);
      execSync('git checkout main');
    }
  }

  saveSession(summary, priority = 'MEDIUM') {
    const status = this.getCurrentProjectStatus();
    if (!status) return false;

    const session = {
      summary,
      priority,
      status,
      metadata: {
        sessionId: `${this.computerId}-${Date.now()}`,
        savedAt: new Date().toISOString()
      }
    };

    try {
      // claude-sessions 브랜치로 전환
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      
      this.ensureSessionBranch();
      execSync(`git checkout ${this.sessionBranch}`);
      
      // 리모트에서 최신 상태 가져오기
      try {
        execSync(`git pull origin ${this.sessionBranch}`, { stdio: 'ignore' });
      } catch (error) {
        // 첫 push인 경우 무시
      }

      if (!fs.existsSync(this.sessionDir)) {
        fs.mkdirSync(this.sessionDir, { recursive: true });
      }

      // 세션 파일 저장
      const sessionFile = path.join(this.sessionDir, this.getSessionFileName());
      fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

      // Git에 커밋 & 푸시
      execSync(`git add ${sessionFile}`);
      execSync(`git commit -m "session: ${this.computerId} - ${summary}"`);
      execSync(`git push origin ${this.sessionBranch}`);

      // 원래 브랜치로 복귀
      execSync(`git checkout ${currentBranch}`);

      console.log(`✅ 세션 저장 완료: ${sessionFile}`);
      console.log(`🌐 GitHub에 동기화 완료`);
      return true;

    } catch (error) {
      console.error('❌ 세션 저장 실패:', error.message);
      try {
        const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        if (currentBranch === this.sessionBranch) {
          execSync('git checkout main');
        }
      } catch (e) {
        // 복구 시도
      }
      return false;
    }
  }

  loadLatestSession() {
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      
      // claude-sessions 브랜치에서 최신 정보 가져오기
      execSync(`git fetch origin ${this.sessionBranch}:${this.sessionBranch}`, { stdio: 'ignore' });
      execSync(`git checkout ${this.sessionBranch}`);
      execSync(`git pull origin ${this.sessionBranch}`, { stdio: 'ignore' });

      // 모든 세션 파일 확인
      if (!fs.existsSync(this.sessionDir)) {
        execSync(`git checkout ${currentBranch}`);
        return null;
      }

      const files = fs.readdirSync(this.sessionDir)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const filePath = path.join(this.sessionDir, f);
          const stat = fs.statSync(filePath);
          return {
            file: f,
            path: filePath,
            mtime: stat.mtime,
            computer: f.split('-')[0] + '-' + f.split('-')[1]
          };
        })
        .sort((a, b) => b.mtime - a.mtime);

      execSync(`git checkout ${currentBranch}`);

      if (files.length === 0) return null;

      // 최신 세션 반환
      const latestSession = JSON.parse(fs.readFileSync(files[0].path, 'utf8'));
      latestSession._metadata = {
        from: files[0].computer,
        file: files[0].file,
        isFromSameComputer: files[0].computer === this.computerId
      };

      return latestSession;

    } catch (error) {
      console.error('❌ 세션 로드 실패:', error.message);
      return null;
    }
  }

  generateHandoverPrompt() {
    const currentStatus = this.getCurrentProjectStatus();
    const lastSession = this.loadLatestSession();

    if (!currentStatus) {
      return '❌ 현재 상태 확인 실패';
    }

    let prompt = `# 🤖 다중 컴퓨터 Claude 세션 인수인계

## 💻 현재 환경
- **컴퓨터**: ${currentStatus.system.computerId}
- **시간**: ${new Date().toLocaleString()}
- **Git 브랜치**: ${currentStatus.git.branch}

## 📊 프로젝트 현재 상태
- **TypeScript 오류**: ${currentStatus.project.tsErrors}개
- **테스트 상태**: ${currentStatus.project.testStatus}
- **Git 변경사항**: ${currentStatus.git.hasChanges ? '있음' : '없음'}

${currentStatus.git.hasChanges ? `
### 변경된 파일들:
\`\`\`
${currentStatus.git.changedFiles.join('\n')}
\`\`\`
` : ''}

### 최근 커밋들:
\`\`\`
${currentStatus.git.recentCommits.join('\n')}
\`\`\`
`;

    if (lastSession) {
      const timeDiff = Math.round((new Date() - new Date(lastSession.metadata.savedAt)) / (1000 * 60));
      const isFromDifferentComputer = !lastSession._metadata.isFromSameComputer;
      
      prompt += `
## 📝 이전 세션 정보
- **마지막 작업**: ${timeDiff}분 전
- **작업한 컴퓨터**: ${lastSession._metadata.from} ${isFromDifferentComputer ? '(다른 컴퓨터)' : '(같은 컴퓨터)'}
- **작업 내용**: ${lastSession.summary}
- **우선순위**: ${lastSession.priority}

### 이전 상태와 비교:
- **TypeScript 오류**: ${lastSession.status.project.tsErrors}개 → ${currentStatus.project.tsErrors}개 ${currentStatus.project.tsErrors < lastSession.status.project.tsErrors ? '✅ 개선됨' : currentStatus.project.tsErrors > lastSession.status.project.tsErrors ? '❌ 악화됨' : '🔄 동일'}
- **테스트**: ${lastSession.status.project.testStatus} → ${currentStatus.project.testStatus}
`;
    }

    prompt += `
## 🎯 권장 다음 작업

${currentStatus.project.tsErrors > 0 ? 
`1. **TypeScript 오류 수정** (HIGH)
   \`\`\`
   tplan-refactoring-specialist Agent 활용
   npm run build로 오류 확인
   \`\`\`` : 
'1. **코드 품질 개선** (MEDIUM)'}

${currentStatus.project.testStatus === 'failing' ?
`2. **테스트 수정** (HIGH)
   \`\`\`
   travel-planner-test-engineer Agent 활용  
   npm run test:e2e로 확인
   \`\`\`` :
'2. **새 기능 개발** (LOW)'}

## 💡 즉시 사용 가능한 명령어
\`\`\`bash
# 개발 환경
npm run dev

# 상태 확인
npm run build        # TypeScript 오류 확인
npm run test:e2e     # 테스트 실행

# 세션 관리
node .claude/multi-session-sync.js save "작업 내용"    # 세션 저장
node .claude/multi-session-sync.js handover           # 인수인계 정보 생성
\`\`\`

---
*🌐 GitHub ${this.sessionBranch} 브랜치를 통해 동기화됨*`;

    return prompt;
  }

  handleCommand(command, ...args) {
    switch (command) {
      case 'save':
        const summary = args.join(' ') || '작업 진행 상황 저장';
        const success = this.saveSession(summary);
        if (success) {
          console.log('🌐 다른 컴퓨터에서 접근 가능합니다!');
        }
        break;

      case 'load':
        const session = this.loadLatestSession();
        if (session) {
          console.log('\n📋 최신 세션 정보:');
          console.log(JSON.stringify(session, null, 2));
        } else {
          console.log('❌ 로드할 세션이 없습니다');
        }
        break;

      case 'handover':
        const prompt = this.generateHandoverPrompt();
        console.log('\n' + prompt);
        break;

      case 'sync':
        console.log('🔄 세션 동기화 중...');
        this.loadLatestSession(); // 이미 동기화 로직 포함됨
        console.log('✅ 동기화 완료');
        break;

      case 'status':
        const status = this.getCurrentProjectStatus();
        console.log(JSON.stringify(status, null, 2));
        break;

      default:
        console.log(`
🌐 다중 컴퓨터 Claude 세션 동기화

사용법:
  node .claude/multi-session-sync.js save "작업 내용"     # 현재 세션을 GitHub에 저장
  node .claude/multi-session-sync.js load                 # 최신 세션 정보 로드  
  node .claude/multi-session-sync.js handover            # 인수인계 프롬프트 생성
  node .claude/multi-session-sync.js sync                # 강제 동기화
  node .claude/multi-session-sync.js status              # 현재 상태만 확인

💡 작업 시작 시: handover
💡 작업 종료 시: save "완료한 작업 내용"
        `);
    }
  }
}

// CLI 실행
if (require.main === module) {
  const sync = new MultiComputerSessionSync();
  const [,, command, ...args] = process.argv;
  sync.handleCommand(command, ...args);
}

module.exports = MultiComputerSessionSync;