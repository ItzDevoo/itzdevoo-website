#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting ItzDevoo website deployment process...\n');

// Deployment configuration
const deployConfig = {
  buildDir: 'dist',
  gitRemote: 'origin',
  gitBranch: 'main',
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

// Check git status
function checkGitStatus() {
  logStep('STEP 3', 'Checking git status...');
  
  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    
    // Check for uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (status.trim()) {
      logWarn('You have uncommitted changes:');
      console.log(status);
      return false;
    } else {
      logSuccess('Working directory is clean');
      return true;
    }
    
  } catch (error) {
    throw new Error('Not a git repository or git not available');
  }
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
      const lastCommit = execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf8' });
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      const autoMessage = `Deploy website updates - ${timestamp}`;
      
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
      resolve(`Deploy website updates - ${new Date().toISOString()}`);
    }
  });
}

// Commit and push to GitHub
function commitAndPush() {
  return new Promise(async (resolve, reject) => {
    logStep('STEP 4', 'Committing and pushing to GitHub...');
    
    try {
      // Check if there are changes to commit
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (!status.trim()) {
        logWarn('No changes to commit');
        resolve();
        return;
      }
      
      // Add all changes
      execSync('git add .', { stdio: 'inherit' });
      logSuccess('Added changes to staging');
      
      // Get commit message
      const commitMessage = await getCommitMessage();
      
      // Commit changes
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      logSuccess('Changes committed');
      
      // Push to remote
      console.log(`\n📤 Pushing to ${deployConfig.gitRemote}/${deployConfig.gitBranch}...`);
      execSync(`git push ${deployConfig.gitRemote} ${deployConfig.gitBranch}`, { stdio: 'inherit' });
      logSuccess('Changes pushed to GitHub!');
      
      deployResults.gitPush = true;
      resolve();
      
    } catch (error) {
      reject(new Error(`Git operations failed: ${error.message}`));
    }
  });
}

// Build Docker image
function buildDockerImage() {
  return new Promise((resolve, reject) => {
    logStep('STEP 5', 'Building Docker image...');
    
    const dockerProcess = spawn('docker', ['build', '-t', deployConfig.dockerImage, '.'], {
      stdio: 'inherit',
      shell: true
    });
    
    dockerProcess.on('close', (code) => {
      if (code === 0) {
        logSuccess('Docker image built successfully!');
        deployResults.dockerBuild = true;
        resolve();
      } else {
        logWarn('Docker build failed (this is optional for GitHub deployment)');
        resolve(); // Don't fail deployment if Docker build fails
      }
    });
    
    dockerProcess.on('error', (error) => {
      logWarn(`Docker not available: ${error.message}`);
      resolve(); // Continue without Docker
    });
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
    console.log('1. Your changes are now on GitHub');
    console.log('2. Your server should automatically pull the updates');
    console.log('3. Restart your Docker container to deploy the changes');
    console.log('\n🐳 Server Commands:');
    console.log('   git pull origin main');
    console.log('   docker-compose down && docker-compose up -d --build');
  }
}

// Show server deployment instructions
function showServerInstructions() {
  console.log('\n🖥️ Server Deployment Instructions:');
  console.log('==================================');
  console.log('Run these commands on your server:');
  console.log('');
  console.log('# Pull latest changes');
  console.log('git pull origin main');
  console.log('');
  console.log('# Rebuild and restart container');
  console.log('docker-compose down');
  console.log('docker-compose up -d --build');
  console.log('');
  console.log('# Check container status');
  console.log('docker-compose ps');
  console.log('docker-compose logs -f');
  console.log('');
  console.log('# Test the deployment');
  console.log('curl http://localhost:8080/health');
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
    
    // Check git status
    const gitClean = checkGitStatus();
    
    // Commit and push if there are changes
    if (gitClean || deployResults.buildSuccess) {
      await commitAndPush();
    }
    
    // Build Docker image (optional)
    await buildDockerImage();
    
    // Show summary
    showDeploymentSummary();
    showServerInstructions();
    
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
    } else if (arg.startsWith('--branch=')) {
      deployConfig.gitBranch = arg.split('=')[1];
    }
  });
}

// Run deployment if called directly
if (require.main === module) {
  parseArgs();
  deploy();
}

module.exports = { deploy, deployConfig };