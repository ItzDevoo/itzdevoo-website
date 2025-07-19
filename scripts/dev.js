#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting ItzDevoo website development server...\n');

// Development configuration
const devConfig = {
  port: 3000,
  host: '127.0.0.1',
  openBrowser: true,
  fallbackPorts: [3001, 3002, 8081, 8082]
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
    darwin: ['open'],
    win32: ['cmd', '/c', 'start'],
    linux: ['xdg-open']
  };
  
  const commandArgs = platforms[process.platform];
  
  if (commandArgs) {
    try {
      const [command, ...args] = commandArgs;
      spawn(command, [...args, url], { stdio: 'ignore', detached: true });
      console.log(`🌐 Opening browser: ${url}`);
    } catch (error) {
      console.log(`⚠️ Could not open browser automatically. Visit: ${url}`);
    }
  } else {
    console.log(`🌐 Please visit: ${url}`);
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

// Check if port is available and find alternative
function findAvailablePort() {
  const net = require('net');
  
  return new Promise((resolve) => {
    const checkPortAvailable = (port) => {
      return new Promise((portResolve) => {
        const server = net.createServer();
        
        server.listen(port, devConfig.host, () => {
          server.close();
          portResolve(true);
        });
        
        server.on('error', () => {
          portResolve(false);
        });
      });
    };
    
    // Check primary port first
    checkPortAvailable(devConfig.port).then(available => {
      if (available) {
        resolve(devConfig.port);
        return;
      }
      
      console.log(`⚠️ Port ${devConfig.port} is already in use`);
      console.log('🔍 Looking for alternative port...\n');
      
      // Try fallback ports
      const tryFallbackPorts = async () => {
        for (const port of devConfig.fallbackPorts) {
          const available = await checkPortAvailable(port);
          if (available) {
            console.log(`✅ Found available port: ${port}`);
            devConfig.port = port; // Update the config
            resolve(port);
            return;
          }
        }
        
        console.log('❌ No available ports found in range');
        resolve(null);
      };
      
      tryFallbackPorts();
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
    
    // Find available port
    const availablePort = await findAvailablePort();
    
    if (availablePort) {
      // Start server
      startDevServer();
    } else {
      console.log('❌ Could not find an available port to start the development server');
      console.log('💡 Try closing other applications using ports 8080-8083 or 3000-3001');
      process.exit(1);
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