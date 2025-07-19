#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 Starting ItzDevoo website deployment to live branch...\n');

// Deployment configuration
const deployConfig = {
  buildDir: 'dist',
  gitRemote: 'origin',
  gitBranch: 'live', // Deploy built files to live branch
  sourceBranch: 'main', // Source code branch
  dockerImage: 'itzdevoo-website',
  runTests: true,
  commitMessage: null // Will be auto-generated or prompted
};

let deployResults = {
  testsPass: false,
  buildSuccess: false,
  gitPush: false,
  dockerBuild: false
};

// Helper functions
function logStep(step, message) {
  console.log(`\n🔵 ${step}: ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

function logWarn(message) {
  console.log(`⚠️ ${message}`);
}

// Run tests
function runTests() {
  return new Promise((resolve, reject) => {
    logStep('STEP 1', 'Running comprehensive tests...');
    
    const testProcess = spawn('node', ['scripts/test.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        logSuccess('All tests passed!');
        deployResults.testsPass = true;
        resolve();
      } else {
        logError('Some tests failed!');
        console.log('\n❓ Do you want to continue deployment anyway? (y/N)');
        
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        readline.question('', (answer) => {
          readline.close();
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            logWarn('Continuing deployment despite test failures...');
            resolve();
          } else {
            reject(new Error('Deployment cancelled due to test failures'));
          }
        });
      }
    });
    
    testProcess.on('error', (error) => {
      reject(new Error(`Error running tests: ${error.message}`));
    });
  });
}

// Build the project
function buildProject() {
  return new Promise((resolve, reject) => {
    logStep('STEP 2', 'Building project for deployment...');
    
    const buildProcess = spawn('node', ['scripts/build.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        logSuccess('Build completed successfully!');
        deployResults.buildSuccess = true;
        resolve();
      } else {
        reject(new Error('Build failed!'));
      }
    });
    
    buildProcess.on('error', (error) => {
      reject(new Error(`Error during build: ${error.message}`));
    });
  });
}

// Get commit message
function getCommitMessage() {
  return new Promise((resolve) => {
    if (deployConfig.commitMessage) {
      resolve(deployConfig.commitMessage);
      return;
    }
    
    // Auto-generate commit message based on changes
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const autoMessage = `Deploy website to live branch - ${timestamp}`;
      
      console.log(`\n📝 Suggested commit message: "${autoMessage}"`);
      console.log('Press Enter to use this message, or type a custom message:');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('> ', (customMessage) => {
        readline.close();
        resolve(customMessage.trim() || autoMessage);
      });
      
    } catch (error) {
      resolve(`Deploy website to live branch - ${new Date().toISOString()}`);
    }
  });
}

// Deploy built files to live branch
function deployToLiveBranch() {
  return new Promise(async (resolve, reject) => {
    logStep('STEP 3', 'Deploying built files to live branch...');
    
    try {
      // Check if dist directory exists
      if (!fs.existsSync(deployConfig.buildDir)) {
        throw new Error(`Build directory ${deployConfig.buildDir} not found. Build must complete first.`);
      }
      
      // Create a temporary directory for the built files
      const tempDir = path.join(os.tmpdir(), 'itzdevoo-deploy-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      
      // Copy built files CONTENTS to temp directory (not the folder itself)
      if (process.platform === 'win32') {
        execSync(`powershell -Command "Copy-Item '${deployConfig.buildDir}\\*' '${tempDir}' -Recurse -Force"`, { stdio: 'inherit' });
      } else {
        execSync(`cp -r ${deployConfig.buildDir}/* ${tempDir}/`, { stdio: 'inherit' });
      }
      logSuccess(`Copied built files to temporary directory: ${tempDir}`);
      
      // Get current branch
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      logSuccess(`Current branch: ${currentBranch}`);
      
      // Stash any uncommitted changes on current branch
      try {
        execSync('git stash push -m "Deploy script auto-stash"', { stdio: 'pipe' });
        logSuccess('Stashed uncommitted changes');
      } catch (error) {
        // No changes to stash is fine
      }
      
      // Fetch from remote to get latest live branch
      try {
        execSync(`git fetch ${deployConfig.gitRemote} live`, { stdio: 'pipe' });
        logSuccess('Fetched latest live branch from remote');
      } catch (error) {
        logWarn('Live branch does not exist on remote, will create it');
      }
      
      // Check if live branch exists locally
      let liveBranchExists = false;
      try {
        execSync('git show-ref --verify --quiet refs/heads/live', { stdio: 'pipe' });
        liveBranchExists = true;
      } catch (error) {
        // Branch doesn't exist locally
      }
      
      // Switch to live branch or create it
      if (liveBranchExists) {
        execSync('git checkout live', { stdio: 'inherit' });
        logSuccess('Switched to live branch');
        
        try {
          execSync(`git reset --hard ${deployConfig.gitRemote}/live`, { stdio: 'inherit' });
          logSuccess('Reset live branch to match remote');
        } catch (error) {
          logWarn('Could not reset to remote live branch (remote may not exist)');
        }
      } else {
        try {
          execSync(`git checkout -b live ${deployConfig.gitRemote}/live`, { stdio: 'inherit' });
          logSuccess('Created and switched to live branch from remote');
        } catch (error) {
          // Remote live doesn't exist, create orphan branch
          execSync('git checkout --orphan live', { stdio: 'inherit' });
          try {
            execSync('git rm -rf .', { stdio: 'pipe' });
          } catch (e) {
            // Fine if no files to remove
          }
          logSuccess('Created new orphan live branch');
        }
      }
      
      // Clear everything in live branch except .git (Windows compatible)
      if (process.platform === 'win32') {
        try {
          execSync('powershell -Command "Get-ChildItem -Path . -Exclude .git | Remove-Item -Recurse -Force"', { stdio: 'pipe' });
          logSuccess('Cleared live branch directory');
        } catch (error) {
          logWarn('Could not clear directory, continuing...');
        }
      } else {
        execSync('find . -maxdepth 1 ! -name .git ! -name . ! -name .. -exec rm -rf {} +', { 
          stdio: 'pipe',
          shell: true 
        });
      }
      
      // Copy built files from temp directory to live branch
      if (process.platform === 'win32') {
        execSync(`powershell -Command "Copy-Item '${tempDir}\\*' '.' -Recurse -Force"`, { stdio: 'inherit' });
      } else {
        execSync(`cp -r ${tempDir}/* .`, { stdio: 'inherit' });
        execSync(`cp -r ${tempDir}/.* . 2>/dev/null || true`, { stdio: 'pipe' });
      }
      logSuccess('Copied built files to live branch');
      
      // Clean up temp directory
      if (process.platform === 'win32') {
        execSync(`powershell -Command "Remove-Item '${tempDir}' -Recurse -Force"`, { stdio: 'pipe' });
      } else {
        execSync(`rm -rf ${tempDir}`, { stdio: 'pipe' });
      }
      logSuccess('Cleaned up temporary directory');
      
      // Add all files
      execSync('git add .', { stdio: 'inherit' });
      
      // Check if there are changes to commit
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (!status.trim()) {
        logWarn('No changes to deploy');
        // Switch back to original branch
        execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' });
        resolve();
        return;
      }
      
      // Get commit message
      const commitMessage = await getCommitMessage();
      
      // Commit the built files
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      logSuccess('Committed built files to live branch');
      
      // Push to remote live branch
      console.log(`\n📤 Pushing to ${deployConfig.gitRemote}/${deployConfig.gitBranch}...`);
      execSync(`git push ${deployConfig.gitRemote} ${deployConfig.gitBranch}`, { stdio: 'inherit' });
      logSuccess('Pushed built files to live branch!');
      
      // Switch back to original branch
      execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' });
      logSuccess(`Switched back to ${currentBranch} branch`);
      
      // Restore stashed changes if any
      try {
        execSync('git stash pop', { stdio: 'pipe' });
        logSuccess('Restored stashed changes');
      } catch (error) {
        // No stash to pop is fine
      }
      
      deployResults.gitPush = true;
      resolve();
      
    } catch (error) {
      // Try to switch back to original branch on error
      try {
        const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        if (currentBranch === 'live') {
          execSync(`git checkout ${deployConfig.sourceBranch}`, { stdio: 'pipe' });
        }
      } catch (switchError) {
        // Ignore switch error
      }
      
      reject(new Error(`Live branch deployment failed: ${error.message}`));
    }
  });
}

// Show deployment summary
function showDeploymentSummary() {
  console.log('\n📊 Deployment Summary:');
  console.log('========================');
  console.log(`✅ Tests: ${deployResults.testsPass ? 'PASSED' : 'SKIPPED'}`);
  console.log(`✅ Build: ${deployResults.buildSuccess ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✅ Git Push: ${deployResults.gitPush ? 'SUCCESS' : 'SKIPPED'}`);
  console.log(`✅ Docker: ${deployResults.dockerBuild ? 'SUCCESS' : 'SKIPPED'}`);
  
  if (deployResults.gitPush) {
    console.log('\n🌐 Next Steps:');
    console.log('1. Built website files are now on the live branch');
    console.log('2. Your server should pull from the live branch');
    console.log('3. The production site at itzdevoo.com should update automatically');
    console.log('\n🐳 Server Commands (if needed):');
    console.log('   git checkout live');
    console.log('   git pull origin live');
    console.log('   docker-compose down && docker-compose up -d --build');
  }
}

// Main deployment function
async function deploy() {
  try {
    console.log('🚀 Starting deployment pipeline...\n');
    
    // Check if we're in the right directory
    if (!fs.existsSync('index.html')) {
      throw new Error('index.html not found. Make sure you\'re in the project directory.');
    }
    
    // Run tests (if enabled)
    if (deployConfig.runTests) {
      await runTests();
    }
    
    // Build project
    await buildProject();
    
    // Deploy built files to live branch
    await deployToLiveBranch();
    
    // Show summary
    showDeploymentSummary();
    
    console.log('\n🎉 Deployment completed successfully!');
    console.log('🌐 Your website should be live at: https://itzdevoo.com');
    
  } catch (error) {
    console.error(`\n❌ Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  args.forEach(arg => {
    if (arg === '--no-tests') {
      deployConfig.runTests = false;
    } else if (arg.startsWith('--message=')) {
      deployConfig.commitMessage = arg.split('=')[1];
    }
  });
}

// Run deployment if called directly
if (require.main === module) {
  parseArgs();
  deploy();
}

module.exports = { deploy, deployConfig };