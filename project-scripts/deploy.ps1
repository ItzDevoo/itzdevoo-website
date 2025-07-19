#!/usr/bin/env pwsh

# Deployment Script for ItzDevoo Website
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment,
    
    [switch]$SkipBuild = $false,
    [switch]$SkipTests = $false,
    [switch]$Force = $false,
    [switch]$Verbose = $false,
    [string]$Branch = "",
    [string]$Tag = "latest"
)

if ($Verbose) {
    $VerbosePreference = "Continue"
}

$ErrorActionPreference = "Stop"

# Deployment configuration
$DeployConfig = @{
    development = @{
        Branch = "development"
        Domain = "dev.itzdevoo.com"
        Port = 8080
        HealthCheck = $true
        BackupEnabled = $false
        TunnelRequired = $false
    }
    staging = @{
        Branch = "main"
        Domain = "staging.itzdevoo.com"
        Port = 8080
        HealthCheck = $true
        BackupEnabled = $true
        TunnelRequired = $true
    }
    production = @{
        Branch = "live"
        Domain = "itzdevoo.com"
        Port = 8080
        HealthCheck = $true
        BackupEnabled = $true
        TunnelRequired = $true
    }
}

$Config = $DeployConfig[$Environment]
$DeploymentId = "deploy_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

Write-Host "🚀 Starting deployment to $Environment" -ForegroundColor Green
Write-Host "Deployment ID: $DeploymentId" -ForegroundColor Cyan
Write-Host "Target Domain: $($Config.Domain)" -ForegroundColor Cyan
Write-Host "Required Branch: $($Config.Branch)" -ForegroundColor Cyan

try {
    # Pre-deployment checks
    Write-Host "`n🔍 Pre-deployment checks..." -ForegroundColor Yellow
    
    # Check Git status
    Write-Verbose "Checking Git repository status..."
    $gitStatus = git status --porcelain 2>$null
    if ($gitStatus -and -not $Force) {
        Write-Host "⚠️ Working directory has uncommitted changes:" -ForegroundColor Yellow
        Write-Host $gitStatus -ForegroundColor Gray
        $continue = Read-Host "Continue deployment? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            throw "Deployment cancelled by user"
        }
    }
    
    # Check current branch
    $currentBranch = git branch --show-current 2>$null
    if ($Branch) {
        $targetBranch = $Branch
    } else {
        $targetBranch = $Config.Branch
    }
    
    if ($currentBranch -ne $targetBranch -and -not $Force) {
        Write-Host "⚠️ Current branch ($currentBranch) doesn't match target ($targetBranch)" -ForegroundColor Yellow
        $switch = Read-Host "Switch to $targetBranch branch? (y/N)"
        if ($switch -eq "y" -or $switch -eq "Y") {
            Write-Host "🔄 Switching to $targetBranch branch..." -ForegroundColor Yellow
            git checkout $targetBranch
            git pull origin $targetBranch
        } else {
            Write-Host "⚠️ Continuing with current branch" -ForegroundColor Yellow
        }
    }
    
    Write-Host "✅ Git checks completed" -ForegroundColor Green
    
    # Check Docker
    docker --version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker is not available"
    }
    Write-Host "✅ Docker is available" -ForegroundColor Green
    
    # Create backup if enabled
    if ($Config.BackupEnabled) {
        Write-Host "`n💾 Creating backup..." -ForegroundColor Yellow
        $backupDir = "backups/$DeploymentId"
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        
        # Backup current container state
        $runningContainer = docker ps --filter "name=itzdevoo-website" --format "{{.ID}}" 2>$null
        if ($runningContainer) {
            Write-Verbose "Backing up running container..."
            docker commit $runningContainer "itzdevoo-website:backup-$DeploymentId" | Out-Null
            Write-Host "✅ Container backup created" -ForegroundColor Green
        }
        
        # Backup configuration files
        $configFiles = @("docker-compose.yml", "nginx.conf", ".env")
        foreach ($file in $configFiles) {
            if (Test-Path $file) {
                Copy-Item $file "$backupDir/" -Force
                Write-Verbose "Backed up: $file"
            }
        }
        
        Write-Host "✅ Backup completed: $backupDir" -ForegroundColor Green
    }
    
    # Run tests if not skipped
    if (-not $SkipTests) {
        Write-Host "`n🧪 Running tests..." -ForegroundColor Yellow
        
        # Basic file structure tests
        $requiredFiles = @("index.html", "styles/main.css", "scripts/main.js", "Dockerfile")
        foreach ($file in $requiredFiles) {
            if (-not (Test-Path $file)) {
                throw "Required file missing: $file"
            }
        }
        
        # HTML validation (basic)
        $htmlContent = Get-Content "index.html" -Raw
        if (-not $htmlContent.Contains("<!DOCTYPE html>")) {
            throw "HTML file missing DOCTYPE declaration"
        }
        
        # CSS validation (basic)
        $cssContent = Get-Content "styles/main.css" -Raw
        if ($cssContent.Length -lt 100) {
            throw "CSS file appears to be empty or too small"
        }
        
        Write-Host "✅ Basic tests passed" -ForegroundColor Green
    }
    
    # Build application if not skipped
    if (-not $SkipBuild) {
        Write-Host "`n🔨 Building application..." -ForegroundColor Yellow
        
        $buildArgs = @(
            "-Environment", $Environment
            "-Tag", $Tag
        )
        
        if ($Verbose) {
            $buildArgs += "-Verbose"
        }
        
        & .\build.ps1 @buildArgs
        
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed"
        }
        
        Write-Host "✅ Build completed successfully" -ForegroundColor Green
    }
    
    # Health check
    if ($Config.HealthCheck) {
        Write-Host "`n🏥 Performing health checks..." -ForegroundColor Yellow
        
        $maxRetries = 10
        $retryCount = 0
        $healthCheckPassed = $false
        
        do {
            Start-Sleep -Seconds 3
            $retryCount++
            
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$($Config.Port)/health" -TimeoutSec 10 -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    $healthCheckPassed = $true
                    Write-Host "✅ Health check passed (Status: $($response.StatusCode))" -ForegroundColor Green
                }
            } catch {
                Write-Verbose "Health check attempt $retryCount failed: $_"
                if ($retryCount -eq $maxRetries) {
                    Write-Host "⚠️ Health check failed after $maxRetries attempts" -ForegroundColor Yellow
                }
            }
        } while (-not $healthCheckPassed -and $retryCount -lt $maxRetries)
        
        if (-not $healthCheckPassed -and -not $Force) {
            throw "Health check failed - deployment aborted"
        }
    }
    
    # Setup Cloudflare tunnel if required
    if ($Config.TunnelRequired) {
        Write-Host "`n🌐 Setting up Cloudflare tunnel..." -ForegroundColor Yellow
        
        # Check if cloudflared is available
        $cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue
        if (-not $cloudflaredPath) {
            Write-Host "⚠️ cloudflared not found. Tunnel setup skipped." -ForegroundColor Yellow
            Write-Host "📖 See cloudflare-tunnel-setup.md for installation instructions" -ForegroundColor Cyan
        } else {
            # Check tunnel configuration
            $configPath = "$env:USERPROFILE\.cloudflared\config.yml"
            if (Test-Path $configPath) {
                Write-Host "✅ Tunnel configuration found" -ForegroundColor Green
                
                # Start tunnel if not already running
                $tunnelProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
                if (-not $tunnelProcess) {
                    Write-Host "🚀 Starting Cloudflare tunnel..." -ForegroundColor Yellow
                    Start-Process -FilePath "cloudflared" -ArgumentList "tunnel", "run", "itzdevoo-website" -NoNewWindow
                    Start-Sleep -Seconds 5
                    Write-Host "✅ Tunnel started" -ForegroundColor Green
                } else {
                    Write-Host "✅ Tunnel already running" -ForegroundColor Green
                }
                
                # Test public accessibility
                try {
                    $publicResponse = Invoke-WebRequest -Uri "https://$($Config.Domain)/health" -TimeoutSec 15 -ErrorAction Stop
                    Write-Host "✅ Public accessibility confirmed (Status: $($publicResponse.StatusCode))" -ForegroundColor Green
                } catch {
                    Write-Host "⚠️ Public accessibility test failed - tunnel may still be connecting" -ForegroundColor Yellow
                    Write-Verbose "Public access error: $_"
                }
            } else {
                Write-Host "⚠️ Tunnel configuration not found at: $configPath" -ForegroundColor Yellow
            }
        }
    }
    
    # Post-deployment verification
    Write-Host "`n✅ Running post-deployment verification..." -ForegroundColor Yellow
    
    # Verify container is running
    $containerStatus = docker ps --filter "name=itzdevoo-website" --format "{{.Status}}"
    if ($containerStatus -like "*Up*") {
        Write-Host "✅ Container is running: $containerStatus" -ForegroundColor Green
    } else {
        throw "Container is not running properly"
    }
    
    # Verify local access
    try {
        $localResponse = Invoke-WebRequest -Uri "http://localhost:$($Config.Port)" -TimeoutSec 10
        Write-Host "✅ Local access verified (Status: $($localResponse.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Local access verification failed" -ForegroundColor Yellow
    }
    
    # Log deployment
    $deploymentLog = @{
        DeploymentId = $DeploymentId
        Environment = $Environment
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Branch = $currentBranch
        GitCommit = git rev-parse --short HEAD 2>$null
        Domain = $Config.Domain
        Status = "Success"
    }
    
    $logEntry = $deploymentLog | ConvertTo-Json -Compress
    Add-Content -Path "deployment.log" -Value $logEntry
    
    # Success summary
    Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
    Write-Host "  • Environment: $Environment" -ForegroundColor White
    Write-Host "  • Deployment ID: $DeploymentId" -ForegroundColor White
    Write-Host "  • Local URL: http://localhost:$($Config.Port)" -ForegroundColor White
    Write-Host "  • Public URL: https://$($Config.Domain)" -ForegroundColor White
    Write-Host "  • Health Check: http://localhost:$($Config.Port)/health" -ForegroundColor White
    
    if ($Config.BackupEnabled) {
        Write-Host "  • Backup Location: backups/$DeploymentId" -ForegroundColor White
    }
    
    Write-Host "`n🔧 Management Commands:" -ForegroundColor Cyan
    Write-Host "  • View logs: docker-compose logs -f" -ForegroundColor White
    Write-Host "  • Stop deployment: .\stop-website.ps1" -ForegroundColor White
    Write-Host "  • Rollback: .\rollback.ps1 -DeploymentId $DeploymentId" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Deployment failed: $_" -ForegroundColor Red
    Write-Verbose "Full error: $($_.Exception | Format-List -Force | Out-String)"
    
    # Log failed deployment
    $failedDeploymentLog = @{
        DeploymentId = $DeploymentId
        Environment = $Environment
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Status = "Failed"
        Error = $_.Exception.Message
    }
    
    $logEntry = $failedDeploymentLog | ConvertTo-Json -Compress
    Add-Content -Path "deployment.log" -Value $logEntry
    
    # Cleanup on failure
    Write-Host "`n🧹 Cleaning up failed deployment..." -ForegroundColor Yellow
    docker-compose down 2>$null
    
    exit 1
}