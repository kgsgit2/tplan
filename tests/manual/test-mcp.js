// Test Supabase MCP server functionality
const { spawn } = require('child_process')

async function testSupabaseMCP() {
  console.log('🚀 Testing Supabase MCP server...')
  
  // Set environment variables
  const env = {
    ...process.env,
    SUPABASE_URL: 'https://fsznctkjtakcvjuhrxpx.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem5jdGtqdGFrY3ZqdWhyeHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY2ODQ2NiwiZXhwIjoyMDczMjQ0NDY2fQ.LE22HM2ndf6nLUki2PpR0H8jnxkoOh8grCZdiuFLeHA',
    SUPABASE_ACCESS_TOKEN: 'sbp_cc4e11291616667bbaab34af14994abf5a4bc282'
  }
  
  try {
    // Test MCP server initialization  
    const mcpProcess = spawn('cmd', ['/c', 'npx', '@supabase/mcp-server-supabase'], { 
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    })
    
    let output = ''
    let errors = ''
    
    mcpProcess.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    mcpProcess.stderr.on('data', (data) => {
      errors += data.toString()
    })
    
    // Send initialization request
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          resources: {},
          tools: {},
          prompts: {}
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    }
    
    mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n')
    
    // Wait for response
    setTimeout(() => {
      mcpProcess.kill()
      
      console.log('📊 MCP Server Output:', output)
      if (errors) {
        console.log('⚠️ MCP Server Errors:', errors)
      }
      
      if (output.includes('capabilities') || output.includes('tools')) {
        console.log('✅ MCP server is working!')
        console.log('🎉 Supabase MCP installation successful!')
        
        console.log('\n📝 Next steps:')
        console.log('1. Restart Claude Desktop application')
        console.log('2. Type /mcp in Claude to see available MCP servers')
        console.log('3. Use Supabase MCP tools to create database tables')
      } else {
        console.log('❌ MCP server may not be working properly')
      }
      
    }, 3000)
    
  } catch (error) {
    console.log('💥 Error testing MCP:', error.message)
  }
}

testSupabaseMCP()