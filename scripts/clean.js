#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning ItzDevoo website...\n');

// Directories and files to clean
const cleanTargets = [
  'dist',
  'build',
  'node_modules',
  '.cache',
  'coverage',
  '*.log',
  '.DS_Store',
  'Thumbs.db'
];

// Clean function
function clean() {
  let cleaned = 0;
  
  cleanTargets.forEach(target => {
    try {
      if (target.includes('*')) {
        // Handle glob patterns
        const pattern = target.replace('*', '');
        const files = fs.readdirSync('.').filter(file => file.includes(pattern));
        
        files.forEach(file => {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log(`🗑️ Removed: ${file}`);
            cleaned++;
          }
        });
      } else {
        // Handle directories and specific files
        if (fs.existsSync(target)) {
          const stat = fs.statSync(target);
          
          if (stat.isDirectory()) {
            fs.rmSync(target, { recursive: true, force: true });
            console.log(`📁 Removed directory: ${target}`);
          } else {
            fs.unlinkSync(target);
            console.log(`🗑️ Removed file: ${target}`);
          }
          cleaned++;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not remove ${target}: ${error.message}`);
    }
  });
  
  if (cleaned === 0) {
    console.log('✨ Already clean! Nothing to remove.');
  } else {
    console.log(`\n✅ Cleaned ${cleaned} items`);
  }
}

// Run clean if called directly
if (require.main === module) {
  clean();
}

module.exports = { clean };