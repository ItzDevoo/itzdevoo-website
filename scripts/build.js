#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔨 Building ItzDevoo website...');

// Build configuration
const buildConfig = {
  sourceDir: '.',
  buildDir: 'dist',
  staticFiles: [
    'index.html',
    'robots.txt',
    'site.webmanifest',
    'sw.js',
    'nginx.conf'
  ],
  staticDirs: [
    'styles',
    'scripts',
    'images'
  ]
};

// Create build directory
function createBuildDir() {
  if (fs.existsSync(buildConfig.buildDir)) {
    fs.rmSync(buildConfig.buildDir, { recursive: true, force: true });
  }
  fs.mkdirSync(buildConfig.buildDir, { recursive: true });
  console.log('📁 Created build directory');
}

// Copy files recursively
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    items.forEach(item => {
      copyRecursive(path.join(src, item), path.join(dest, item));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy static files
function copyStaticFiles() {
  console.log('📋 Copying static files...');
  
  buildConfig.staticFiles.forEach(file => {
    const srcPath = path.join(buildConfig.sourceDir, file);
    const destPath = path.join(buildConfig.buildDir, file);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ ${file}`);
    } else {
      console.warn(`  ⚠️ ${file} not found`);
    }
  });
}

// Copy static directories
function copyStaticDirs() {
  console.log('📂 Copying static directories...');
  
  buildConfig.staticDirs.forEach(dir => {
    const srcPath = path.join(buildConfig.sourceDir, dir);
    const destPath = path.join(buildConfig.buildDir, dir);
    
    if (fs.existsSync(srcPath)) {
      copyRecursive(srcPath, destPath);
      console.log(`  ✓ ${dir}/`);
    } else {
      console.warn(`  ⚠️ ${dir}/ not found`);
    }
  });
}

// Validate build
function validateBuild() {
  console.log('🔍 Validating build...');
  
  const requiredFiles = ['index.html', 'styles/main.css', 'scripts/main.js'];
  let isValid = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(buildConfig.buildDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✓ ${file}`);
    } else {
      console.error(`  ❌ ${file} missing`);
      isValid = false;
    }
  });
  
  return isValid;
}

// Generate build info
function generateBuildInfo() {
  const buildInfo = {
    version: require('../package.json').version,
    buildTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    gitCommit: process.env.GIT_COMMIT || 'unknown'
  };
  
  fs.writeFileSync(
    path.join(buildConfig.buildDir, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
  
  console.log('📝 Generated build info');
}

// Main build process
function build() {
  try {
    console.log('🚀 Starting build process...');
    
    createBuildDir();
    copyStaticFiles();
    copyStaticDirs();
    generateBuildInfo();
    
    if (validateBuild()) {
      console.log('✅ Build completed successfully!');
      console.log(`📦 Build output: ${path.resolve(buildConfig.buildDir)}`);
      process.exit(0);
    } else {
      console.error('❌ Build validation failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run build if called directly
if (require.main === module) {
  build();
}

module.exports = { build, buildConfig };