#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Running ItzDevoo website tests...');

// Test configuration
const tests = {
  files: [
    'index.html',
    'styles/main.css',
    'scripts/main.js',
    'robots.txt',
    'site.webmanifest',
    'sw.js',
    'nginx.conf'
  ],
  directories: [
    'styles',
    'scripts',
    'images'
  ],
  htmlValidation: true,
  cssValidation: true,
  jsValidation: true
};

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Helper functions
function logPass(message) {
  console.log(`  ✅ ${message}`);
  testResults.passed++;
}

function logFail(message) {
  console.log(`  ❌ ${message}`);
  testResults.failed++;
}

function logWarn(message) {
  console.log(`  ⚠️ ${message}`);
  testResults.warnings++;
}

// Test file existence
function testFileExistence() {
  console.log('\n📄 Testing file existence...');
  
  tests.files.forEach(file => {
    if (fs.existsSync(file)) {
      logPass(`${file} exists`);
    } else {
      logFail(`${file} missing`);
    }
  });
}

// Test directory existence
function testDirectoryExistence() {
  console.log('\n📁 Testing directory existence...');
  
  tests.directories.forEach(dir => {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      logPass(`${dir}/ exists`);
    } else {
      logFail(`${dir}/ missing or not a directory`);
    }
  });
}

// Test HTML structure
function testHtmlStructure() {
  console.log('\n🌐 Testing HTML structure...');
  
  try {
    const htmlContent = fs.readFileSync('index.html', 'utf8');
    
    // Basic HTML structure tests
    if (htmlContent.includes('<!DOCTYPE html>')) {
      logPass('DOCTYPE declaration found');
    } else {
      logFail('DOCTYPE declaration missing');
    }
    
    if (htmlContent.includes('<html lang=')) {
      logPass('Language attribute found');
    } else {
      logWarn('Language attribute missing');
    }
    
    if (htmlContent.includes('<meta charset=')) {
      logPass('Charset meta tag found');
    } else {
      logFail('Charset meta tag missing');
    }
    
    if (htmlContent.includes('<meta name="viewport"')) {
      logPass('Viewport meta tag found');
    } else {
      logFail('Viewport meta tag missing');
    }
    
    if (htmlContent.includes('<title>')) {
      logPass('Title tag found');
    } else {
      logFail('Title tag missing');
    }
    
    // SEO and accessibility tests
    if (htmlContent.includes('alt=')) {
      logPass('Image alt attributes found');
    } else {
      logWarn('No image alt attributes found');
    }
    
    if (htmlContent.includes('aria-')) {
      logPass('ARIA attributes found');
    } else {
      logWarn('No ARIA attributes found');
    }
    
  } catch (error) {
    logFail(`Error reading HTML file: ${error.message}`);
  }
}

// Test CSS files
function testCssFiles() {
  console.log('\n🎨 Testing CSS files...');
  
  try {
    const cssContent = fs.readFileSync('styles/main.css', 'utf8');
    
    if (cssContent.includes('@import')) {
      logPass('CSS imports found');
    } else {
      logWarn('No CSS imports found');
    }
    
    // Check if variables CSS exists
    if (fs.existsSync('styles/base/variables.css')) {
      const variablesContent = fs.readFileSync('styles/base/variables.css', 'utf8');
      if (variablesContent.includes(':root')) {
        logPass('CSS custom properties defined');
      } else {
        logWarn('No CSS custom properties found');
      }
    }
    
  } catch (error) {
    logFail(`Error reading CSS files: ${error.message}`);
  }
}

// Test JavaScript files
function testJsFiles() {
  console.log('\n⚡ Testing JavaScript files...');
  
  try {
    const jsContent = fs.readFileSync('scripts/main.js', 'utf8');
    
    if (jsContent.includes('import')) {
      logPass('ES6 imports found');
    } else {
      logWarn('No ES6 imports found');
    }
    
    if (jsContent.includes('export')) {
      logPass('ES6 exports found');
    } else {
      logWarn('No ES6 exports found');
    }
    
    if (jsContent.includes('addEventListener')) {
      logPass('Event listeners found');
    } else {
      logWarn('No event listeners found');
    }
    
    // Check for security features
    if (jsContent.includes('initSecurity')) {
      logPass('Security initialization found');
    } else {
      logWarn('No security initialization found');
    }
    
  } catch (error) {
    logFail(`Error reading JavaScript files: ${error.message}`);
  }
}

// Test service worker
function testServiceWorker() {
  console.log('\n🔧 Testing Service Worker...');
  
  try {
    const swContent = fs.readFileSync('sw.js', 'utf8');
    
    if (swContent.includes('install')) {
      logPass('Install event handler found');
    } else {
      logFail('Install event handler missing');
    }
    
    if (swContent.includes('activate')) {
      logPass('Activate event handler found');
    } else {
      logFail('Activate event handler missing');
    }
    
    if (swContent.includes('fetch')) {
      logPass('Fetch event handler found');
    } else {
      logFail('Fetch event handler missing');
    }
    
    if (swContent.includes('caches')) {
      logPass('Cache API usage found');
    } else {
      logFail('Cache API usage missing');
    }
    
  } catch (error) {
    logFail(`Error reading Service Worker: ${error.message}`);
  }
}

// Test web manifest
function testWebManifest() {
  console.log('\n📱 Testing Web App Manifest...');
  
  try {
    const manifestContent = fs.readFileSync('site.webmanifest', 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    if (manifest.name) {
      logPass('App name defined');
    } else {
      logFail('App name missing');
    }
    
    if (manifest.short_name) {
      logPass('Short name defined');
    } else {
      logWarn('Short name missing');
    }
    
    if (manifest.start_url) {
      logPass('Start URL defined');
    } else {
      logFail('Start URL missing');
    }
    
    if (manifest.display) {
      logPass('Display mode defined');
    } else {
      logWarn('Display mode missing');
    }
    
    if (manifest.icons && manifest.icons.length > 0) {
      logPass('Icons defined');
    } else {
      logFail('Icons missing');
    }
    
  } catch (error) {
    logFail(`Error reading Web Manifest: ${error.message}`);
  }
}

// Test nginx configuration
function testNginxConfig() {
  console.log('\n🔧 Testing Nginx configuration...');
  
  try {
    const nginxContent = fs.readFileSync('nginx.conf', 'utf8');
    
    if (nginxContent.includes('listen 8080')) {
      logPass('Port 8080 configured');
    } else {
      logFail('Port 8080 not configured');
    }
    
    if (nginxContent.includes('gzip on')) {
      logPass('Gzip compression enabled');
    } else {
      logWarn('Gzip compression not enabled');
    }
    
    if (nginxContent.includes('add_header')) {
      logPass('Security headers configured');
    } else {
      logFail('Security headers missing');
    }
    
    if (nginxContent.includes('expires')) {
      logPass('Cache headers configured');
    } else {
      logWarn('Cache headers not configured');
    }
    
  } catch (error) {
    logFail(`Error reading Nginx config: ${error.message}`);
  }
}

// Main test runner
function runTests() {
  console.log('🧪 Starting comprehensive website tests...\n');
  
  testFileExistence();
  testDirectoryExistence();
  testHtmlStructure();
  testCssFiles();
  testJsFiles();
  testServiceWorker();
  testWebManifest();
  testNginxConfig();
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`  ✅ Passed: ${testResults.passed}`);
  console.log(`  ❌ Failed: ${testResults.failed}`);
  console.log(`  ⚠️ Warnings: ${testResults.warnings}`);
  
  const total = testResults.passed + testResults.failed;
  const successRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`  📈 Success Rate: ${successRate}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testResults };