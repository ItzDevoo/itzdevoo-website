#!/usr/bin/env pwsh

# Rollback Script for ItzDevoo website
param(
    [string]$DeploymentId = "",
    [string]$BackupImage = "",
    [switch]$ListBackups = $false,
    [switch]$Force = $false,
    [switch]$Verbose = $false
)

if ($Verbose) {
    $VerbosePreference = "Continue"
}

$ErrorActionPreference = "Stop"

Write-Host "🔄 ItzDevoo website Rollback Utility" -ForegroundColor Green

try {
    # List available backups
    if ($ListBackups) {
        Write-Host "`n📋 Available Backups:" -ForegroundColor Cyan
        
        # List backup directories
        if (Test-Path "backups") {
            $backupDirs = Get-ChildItem "backups" -Directory | Sort-Object Name -Descending
            if ($backupDirs) {
                Write-Host "📁 Backup Directories:" -ForegroundColor Yellow
                foreach ($dir in $backupDirs) {
                    $timestamp = $dir.Name -replace "deploy_", "" -replace "_", " "
                    Write-Host "  • $($dir.Name) (Created: $timestamp)" -ForegroundColor White
                }
            } else {
                Write-Host "  No backup directories found" -ForegroundColor Gray
            }
        }
        
        # List backup Docker images
        $backupImages = docker images --filter "reference=itzdevoo-website:backup-*" --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}"
        if ($backupImages -and $backupImages.Count -gt 1) {
            Write-Host "`n🐳 Backup Docker Images:" -ForegroundColor Yellow
            Write-Host $backupImages -ForegroundColor White
        } else {
            Write-Host "`n🐳 No backup Docker images found" -ForegroundColor Gray
        }
        
        # Show deployment log
        if (Test-Path "deployment.log") {
            Write-Host "`n📜 Recent Deployments:" -ForegroundColor Yellow
            $recentDeployments = Get-Content "deployment.log" | ForEach-Object {
                $_ | ConvertFrom-Json
            } | Sort-Object Timestamp -Descending | Select-Object -First 5
            
            foreach ($deployment in $recentDeployments) {
                $status = if ($deployment.Status -eq "Success") { "✅" } else { "❌" }
                Write-Host "  $status $($deployment.DeploymentId) - $($deployment.Environment) - $($deployment.Timestamp)" -ForegroundColor White
            }
        }
        
        return
    }
    
    # Validate parameters
    if (-not $DeploymentId -and -not $BackupImage) {
        Write-Host "❌ Please specify either -DeploymentId or -BackupImage" -ForegroundColor Red
        Write-Host "💡 Use -ListBackups to see available options" -ForegroundColor Cyan
        exit 1
    }
    
    # Determine backup source
    $backupSource = ""
    $backupType = ""
    
    if ($DeploymentId) {
        # Check for backup directory
        $backupDir = "backups/$DeploymentId"
        if (Test-Path $backupDir) {
            $backupSource = $backupDir
            $backupType = "directory"
            Write-Host "📁 Using backup directory: $backupDir" -ForegroundColor Cyan
        }
        
        # Check for backup Docker image
        $backupImageName = "itzdevoo-website:backup-$DeploymentId"
        $imageExists = docker images --filter "reference=$backupImageName" --format "{{.Repository}}:{{.Tag}}" 2>$null
        if ($imageExists) {
            $backupSource = $backupImageName
            $backupType = "image"
            Write-Host "🐳 Using backup Docker image: $backupImageName" -ForegroundColor Cyan
        }
        
        if (-not $backupSource) {
            throw "No backup found for deployment ID: $DeploymentId"
        }
    }
    
    if ($BackupImage) {
        # Verify backup image exists
        $imageExists = docker images --filter "reference=$BackupImage" --format "{{.Repository}}:{{.Tag}}" 2>$null
        if ($imageExists) {
            $backupSource = $BackupImage
            $backupType = "image"
            Write-Host "🐳 Using specified backup image: $BackupImage" -ForegroundColor Cyan
        } else {
            throw "Backup image not found: $BackupImage"
        }
    }
    
    # Confirmation
    if (-not $Force) {
        Write-Host "`n⚠️ This will stop the current deployment and restore from backup" -ForegroundColor Yellow
        Write-Host "Backup Source: $backupSource" -ForegroundColor White
        Write-Host "Backup Type: $backupType" -ForegroundColor White
        
        $confirm = Read-Host "`nContinue with rollback? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Host "Rollback cancelled by user" -ForegroundColor Yellow
            exit 0
        }
    }
    
    # Create pre-rollback backup of current state
    Write-Host "`n💾 Creating pre-rollback backup..." -ForegroundColor Yellow
    $preRollbackId = "pre-rollback_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    
    $currentContainer = docker ps --filter "name=itzdevoo-website" --format "{{.ID}}" 2>$null
    if ($currentContainer) {
        docker commit $currentContainer "itzdevoo-website:$preRollbackId" | Out-Null
        Write-Host "✅ Pre-rollback backup created: itzdevoo-website:$preRollbackId" -ForegroundColor Green
    }
    
    # Stop current deployment
    Write-Host "`n🛑 Stopping current deployment..." -ForegroundColor Yellow
    docker-compose down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Current deployment stopped" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Error stopping current deployment, continuing..." -ForegroundColor Yellow
    }
    
    # Perform rollback based on backup type
    if ($backupType -eq "image") {
        Write-Host "`n🔄 Rolling back from Docker image..." -ForegroundColor Yellow
        
        # Tag backup image as latest
        docker tag $backupSource "itzdevoo-website:rollback"
        
        # Update docker-compose to use rollback image
        $composeContent = Get-Content "docker-compose.yml" -Raw
        $updatedCompose = $composeContent -replace "image: itzdevoo-website:latest", "image: itzdevoo-website:rollback"
        Set-Content "docker-compose.yml" -Value $updatedCompose
        
        Write-Host "✅ Docker image rollback prepared" -ForegroundColor Green
        
    } elseif ($backupType -eq "directory") {
        Write-Host "`n🔄 Rolling back from backup directory..." -ForegroundColor Yellow
        
        # Restore configuration files
        $configFiles = Get-ChildItem $backupSource -File
        foreach ($file in $configFiles) {
            Copy-Item $file.FullName "." -Force
            Write-Verbose "Restored: $($file.Name)"
        }
        
        Write-Host "✅ Configuration files restored" -ForegroundColor Green
        
        # Rebuild with restored configuration
        Write-Host "🔨 Rebuilding with restored configuration..." -ForegroundColor Yellow
        & .\build.ps1 -Environment "production" -NoCache
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to rebuild from backup configuration"
        }
    }
    
    # Start rolled back deployment
    Write-Host "`n🚀 Starting rolled back deployment..." -ForegroundColor Yellow
    docker-compose up -d
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start rolled back deployment"
    }
    
    # Wait for container to be healthy
    Write-Host "`n⏳ Waiting for rollback to be healthy..." -ForegroundColor Yellow
    $timeout = 60
    $elapsed = 0
    
    do {
        Start-Sleep -Seconds 2
        $elapsed += 2
        $health = docker inspect --format='{{.State.Health.Status}}' itzdevoo-website 2>$null
        Write-Verbose "Health status: $health (${elapsed}s elapsed)"
    } while ($health -ne "healthy" -and $elapsed -lt $timeout)
    
    if ($health -eq "healthy") {
        Write-Host "✅ Rollback is healthy!" -ForegroundColor Green
        
        # Test connectivity
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 10
            Write-Host "✅ Health check passed (Status: $($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Health check failed, but container is healthy" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "⚠️ Rollback may not be fully ready yet" -ForegroundColor Yellow
    }
    
    # Log rollback
    $rollbackLog = @{
        RollbackId = "rollback_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        BackupSource = $backupSource
        BackupType = $backupType
        PreRollbackBackup = "itzdevoo-website:$preRollbackId"
        Status = "Success"
    }
    
    $logEntry = $rollbackLog | ConvertTo-Json -Compress
    Add-Content -Path "rollback.log" -Value $logEntry
    
    # Success summary
    Write-Host "`n🎉 Rollback completed successfully!" -ForegroundColor Green
    Write-Host "📋 Rollback Summary:" -ForegroundColor Cyan
    Write-Host "  • Backup Source: $backupSource" -ForegroundColor White
    Write-Host "  • Backup Type: $backupType" -ForegroundColor White
    Write-Host "  • Pre-rollback Backup: itzdevoo-website:$preRollbackId" -ForegroundColor White
    Write-Host "  • Local URL: http://localhost:8080" -ForegroundColor White
    Write-Host "  • Health Check: http://localhost:8080/health" -ForegroundColor White
    
    Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
    Write-Host "  • Test the rolled back deployment thoroughly" -ForegroundColor White
    Write-Host "  • If issues persist, you can rollback to: itzdevoo-website:$preRollbackId" -ForegroundColor White
    Write-Host "  • Clean up backup images when no longer needed" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Rollback failed: $_" -ForegroundColor Red
    Write-Verbose "Full error: $($_.Exception | Format-List -Force | Out-String)"
    
    # Log failed rollback
    $failedRollbackLog = @{
        RollbackId = "rollback_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        BackupSource = $backupSource
        Status = "Failed"
        Error = $_.Exception.Message
    }
    
    $logEntry = $failedRollbackLog | ConvertTo-Json -Compress
    Add-Content -Path "rollback.log" -Value $logEntry
    
    Write-Host "`n🆘 Emergency Recovery:" -ForegroundColor Yellow
    Write-Host "  • Check container status: docker ps -a" -ForegroundColor White
    Write-Host "  • View logs: docker-compose logs" -ForegroundColor White
    Write-Host "  • Manual cleanup: docker-compose down && docker system prune" -ForegroundColor White
    
    exit 1
}