#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting ItzDevoo website development server...\n');

// Development configuration
const devConfig = {
  port: 8080,
  host: '127.0.0.1',
  openBrowser: true
};

// Run tests first
function runTests() {
  console.log('🧪 Running tests first...');
  
  return new Promise((resolve, reject) => {
    const testProcess = spawn('node', ['scripts/test.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Tests passed! Starting server...\n');
        resolve();
      } else {
        console.log('⚠️ Some tests failed, but continuing with dev server...\n');
        resolve(); // Continue even if tests fail in dev mode
      }
    });
    
    testProcess.on('error', (error) => {
      console.error('❌ Error running tests:', error.message);
      resolve(); // Continue even if tests error
    });
  });
}

// Start development server
function startDevServer() {
  console.log(`🌐 Starting development server on http://${devConfig.host}:${devConfig.port}`);
  console.log('📁 Serving files from current directory');
  console.log('🔄 Auto-reload: Manual refresh required');
  console.log('🛑 Press Ctrl+C to stop\n');
  
  // Try different server options
  const serverCommands = [
    ['python', ['-m', 'http.server', devConfig.port.toString()]],
    ['python3', ['-m', 'http.server', devConfig.port.toString()]],
    ['npx', ['serve', '-l', devConfig.port.toString(), '.']]
  ];
  
  function tryStartServer(commandIndex = 0) {
    if (commandIndex >= serverCommands.length) {
      console.error('❌ Unable to start development server. Please install Python or Node.js');
      process.exit(1);
    }
    
    const [command, args] = serverCommands[commandIndex];
    
    console.log(`⚡ Trying: ${command} ${args.join(' ')}`);
    
    const serverProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    serverProcess.on('error', (error) => {
      console.log(`❌ ${command} not available, trying next option...`);
      tryStartServer(commandIndex + 1);
    });
    
    serverProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(`❌ Server exited with code ${code}`);
      }
    });
    
    // If we get here, server started successfully
    setTimeout(() => {
      console.log(`\n✅ Development server started!`);
      console.log(`🌐 Visit: http://${devConfig.host}:${devConfig.port}`);
      console.log(`📱 Mobile: http://YOUR_LOCAL_IP:${devConfig.port}`);
      console.log(`🔧 Health check: http://${devConfig.host}:${devConfig.port}/health`);
      
      if (devConfig.openBrowser) {
        openBrowser();
      }
    }, 2000);
  }
  
  tryStartServer();
}

// Open browser (optional)
function openBrowser() {
  const url = `http://${devConfig.host}:${devConfig.port}`;
  
  const platforms = {
    darwin: 'open',
    win32: 'start',
    linux: 'xdg-open'
  };
  
  const command = platforms[process.platform];
  
  if (command) {
    try {
      spawn(command, [url], { stdio: 'ignore', detached: true });
      console.log(`🌐 Opening browser: ${url}`);
    } catch (error) {
      console.log(`⚠️ Could not open browser automatically. Visit: ${url}`);
    }
  }
}

// Show development tips
function showDevTips() {
  console.log('\n📝 Development Tips:');
  console.log('  • Edit files and refresh browser to see changes');
  console.log('  • Use browser dev tools to test responsive design');
  console.log('  • Check console for JavaScript errors');
  console.log('  • Test service worker in incognito mode');
  console.log('  • Run `npm test` to validate your changes');
  console.log('  • Run `npm run build` when ready to deploy');
}

// Handle cleanup on exit
function setupCleanup() {
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down development server...');
    console.log('👋 Thanks for developing with ItzDevoo website!');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n\n🛑 Development server terminated');
    process.exit(0);
  });
}

// Check if port is available
function checkPort() {
  const net = require('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(devConfig.port, devConfig.host, () => {
      server.close();
      resolve(true);
    });
    
    server.on('error', () => {
      console.log(`⚠️ Port ${devConfig.port} is already in use`);
      console.log('🔄 Trying to use the existing server...\n');
      resolve(false);
    });
  });
}

// Main development function
async function startDevelopment() {
  try {
    console.log('🔧 Setting up development environment...\n');
    
    // Check if we're in the right directory
    if (!fs.existsSync('index.html')) {
      console.error('❌ index.html not found. Make sure you\'re in the project directory.');
      process.exit(1);
    }
    
    // Run tests
    await runTests();
    
    // Check port availability
    const portAvailable = await checkPort();
    
    if (portAvailable) {
      // Start server
      startDevServer();
    } else {
      console.log(`🌐 Development server might already be running at http://${devConfig.host}:${devConfig.port}`);
      if (devConfig.openBrowser) {
        openBrowser();
      }
    }
    
    // Show tips
    showDevTips();
    
    // Setup cleanup
    setupCleanup();
    
  } catch (error) {
    console.error('❌ Error starting development:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  startDevelopment();
}

module.exports = { startDevelopment, devConfig };