#!/usr/bin/env pwsh

# Stop website and Cloudflare Tunnel
param(
    [switch]$Force = $false,
    [switch]$Verbose = $false
)

if ($Verbose) {
    $VerbosePreference = "Continue"
}

Write-Host "🛑 Stopping ItzDevoo website..." -ForegroundColor Yellow

try {
    $stoppedComponents = @()
    $errors = @()
    
    # Stop Cloudflare tunnel
    Write-Host "🌐 Stopping Cloudflare tunnel..." -ForegroundColor Yellow
    Write-Verbose "Looking for cloudflared processes..."
    
    $cloudflaredProcesses = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($cloudflaredProcesses) {
        foreach ($process in $cloudflaredProcesses) {
            Write-Verbose "Stopping cloudflared process (PID: $($process.Id))..."
            try {
                if ($Force) {
                    $process | Stop-Process -Force
                } else {
                    $process | Stop-Process
                }
                $stoppedComponents += "Cloudflare Tunnel (PID: $($process.Id))"
            } catch {
                $errors += "Failed to stop cloudflared process $($process.Id): $_"
                Write-Verbose "Error stopping cloudflared: $_"
            }
        }
        
        # Wait a moment for graceful shutdown
        if (-not $Force) {
            Start-Sleep -Seconds 3
        }
        
        # Check if any processes are still running
        $remainingProcesses = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
        if ($remainingProcesses) {
            Write-Host "⚠️ Some cloudflared processes are still running. Use -Force to kill them." -ForegroundColor Yellow
            foreach ($process in $remainingProcesses) {
                Write-Host "  • PID: $($process.Id)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Verbose "No cloudflared processes found"
        Write-Host "ℹ️ No Cloudflare tunnel processes were running" -ForegroundColor Gray
    }
    
    # Stop Docker container
    Write-Host "📦 Stopping Docker container..." -ForegroundColor Yellow
    Write-Verbose "Running docker-compose down..."
    
    if ($Force) {
        docker-compose down --remove-orphans --volumes
    } else {
        docker-compose down
    }
    
    if ($LASTEXITCODE -eq 0) {
        $stoppedComponents += "Docker Container"
        Write-Verbose "Docker container stopped successfully"
    } else {
        $errors += "Failed to stop Docker container (exit code: $LASTEXITCODE)"
        Write-Verbose "Docker stop failed with exit code: $LASTEXITCODE"
    }
    
    # Clean up Docker resources if Force is specified
    if ($Force) {
        Write-Host "🧹 Cleaning up Docker resources..." -ForegroundColor Yellow
        Write-Verbose "Removing unused Docker resources..."
        
        # Remove unused containers, networks, images
        docker system prune -f 2>$null
        if ($LASTEXITCODE -eq 0) {
            $stoppedComponents += "Docker Cleanup"
        }
    }
    
    # Display results
    Write-Host "`n📋 Stop Summary:" -ForegroundColor Cyan
    
    if ($stoppedComponents.Count -gt 0) {
        Write-Host "✅ Successfully stopped:" -ForegroundColor Green
        foreach ($component in $stoppedComponents) {
            Write-Host "  • $component" -ForegroundColor White
        }
    }
    
    if ($errors.Count -gt 0) {
        Write-Host "❌ Errors encountered:" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  • $error" -ForegroundColor White
        }
    }
    
    # Verify everything is stopped
    Write-Host "`n🔍 Verification:" -ForegroundColor Cyan
    
    # Check Docker containers
    $runningContainers = docker ps --filter "name=itzdevoo-website" --format "table {{.Names}}\t{{.Status}}" 2>$null
    if ($runningContainers -and $runningContainers.Count -gt 1) {
        Write-Host "⚠️ Some Docker containers may still be running:" -ForegroundColor Yellow
        Write-Host $runningContainers -ForegroundColor Gray
    } else {
        Write-Host "✅ No website Docker containers running" -ForegroundColor Green
    }
    
    # Check cloudflared processes
    $remainingCloudflared = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($remainingCloudflared) {
        Write-Host "⚠️ Cloudflared processes still running:" -ForegroundColor Yellow
        foreach ($process in $remainingCloudflared) {
            Write-Host "  • PID: $($process.Id), CPU: $($process.CPU)" -ForegroundColor Gray
        }
    } else {
        Write-Host "✅ No cloudflared processes running" -ForegroundColor Green
    }
    
    # Test local connectivity (should fail)
    Write-Verbose "Testing if local service is still accessible..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "⚠️ Local service still responding (Status: $($response.StatusCode))" -ForegroundColor Yellow
    } catch {
        Write-Host "✅ Local service is no longer accessible" -ForegroundColor Green
        Write-Verbose "Expected connection failure: $_"
    }
    
    if ($errors.Count -eq 0) {
        Write-Host "`n✅ website stopped successfully" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ website stopped with some errors" -ForegroundColor Yellow
        if ($Force) {
            Write-Host "💡 All components have been forcefully stopped" -ForegroundColor Cyan
        } else {
            Write-Host "💡 Try running with -Force flag for forceful shutdown" -ForegroundColor Cyan
        }
    }
    
} catch {
    Write-Host "❌ Error stopping website: $_" -ForegroundColor Red
    Write-Verbose "Full error details: $($_.Exception | Format-List -Force | Out-String)"
    exit 1
}

Write-Host "`n🏁 Stop operation complete!" -ForegroundColor Green