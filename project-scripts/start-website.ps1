#!/usr/bin/env pwsh

# Start website with Cloudflare Tunnel
param(
    [string]$Environment = "production",
    [switch]$SkipTunnel = $false,
    [switch]$Verbose = $false
)

if ($Verbose) {
    $VerbosePreference = "Continue"
}

Write-Host "🚀 Starting ItzDevoo website with Cloudflare Tunnel..." -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Cyan

try {
    # Check if Docker is running
    Write-Verbose "Checking Docker status..."
    $dockerStatus = docker info 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
    
    # Start Docker container
    Write-Host "📦 Starting Docker container..." -ForegroundColor Yellow
    docker-compose up -d --build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker container started successfully" -ForegroundColor Green
        
        # Wait for container to be healthy
        Write-Host "⏳ Waiting for container to be healthy..." -ForegroundColor Yellow
        $timeout = 60
        $elapsed = 0
        
        do {
            Start-Sleep -Seconds 2
            $elapsed += 2
            $health = docker inspect --format='{{.State.Health.Status}}' itzdevoo-website 2>$null
            Write-Verbose "Container health status: $health (elapsed: ${elapsed}s)"
        } while ($health -ne "healthy" -and $elapsed -lt $timeout)
        
        if ($health -eq "healthy") {
            Write-Host "✅ Container is healthy" -ForegroundColor Green
            
            # Test local connectivity
            Write-Verbose "Testing local connectivity..."
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 10 -ErrorAction Stop
                Write-Host "✅ Local health check passed (Status: $($response.StatusCode))" -ForegroundColor Green
            } catch {
                Write-Host "⚠️ Local health check failed, but continuing..." -ForegroundColor Yellow
                Write-Verbose "Health check error: $_"
            }
            
            if (-not $SkipTunnel) {
                # Check if cloudflared is installed
                Write-Verbose "Checking cloudflared installation..."
                $cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue
                if (-not $cloudflaredPath) {
                    Write-Host "⚠️ cloudflared not found. Please install Cloudflare Tunnel client." -ForegroundColor Yellow
                    Write-Host "📖 See cloudflare-tunnel-setup.md for installation instructions" -ForegroundColor Cyan
                    Write-Host "🌐 website is running locally at http://localhost:8080" -ForegroundColor Green
                } else {
                    # Start Cloudflare tunnel
                    Write-Host "🌐 Starting Cloudflare tunnel..." -ForegroundColor Yellow
                    
                    # Check if tunnel configuration exists
                    $configPath = "$env:USERPROFILE\.cloudflared\config.yml"
                    if (Test-Path $configPath) {
                        Write-Verbose "Using tunnel configuration: $configPath"
                        
                        # Start tunnel in background
                        $tunnelProcess = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel", "run", "itzdevoo-website" -NoNewWindow -PassThru
                        
                        if ($tunnelProcess) {
                            Write-Host "✅ Cloudflare tunnel started (PID: $($tunnelProcess.Id))" -ForegroundColor Green
                            
                            # Wait a moment for tunnel to establish
                            Start-Sleep -Seconds 5
                            
                            # Test tunnel connectivity
                            Write-Verbose "Testing tunnel connectivity..."
                            try {
                                $tunnelResponse = Invoke-WebRequest -Uri "https://itzdevoo.com/health" -TimeoutSec 15 -ErrorAction Stop
                                Write-Host "🎉 website is now accessible at https://itzdevoo.com" -ForegroundColor Green
                                Write-Host "📊 Health check: https://health.itzdevoo.com" -ForegroundColor Cyan
                            } catch {
                                Write-Host "⚠️ Tunnel may still be connecting. Please wait a moment and try accessing https://itzdevoo.com" -ForegroundColor Yellow
                                Write-Verbose "Tunnel connectivity test error: $_"
                            }
                        } else {
                            Write-Host "❌ Failed to start Cloudflare tunnel" -ForegroundColor Red
                        }
                    } else {
                        Write-Host "⚠️ Cloudflare tunnel configuration not found at: $configPath" -ForegroundColor Yellow
                        Write-Host "📖 Please run the tunnel setup first. See cloudflare-tunnel-setup.md" -ForegroundColor Cyan
                    }
                }
            } else {
                Write-Host "🌐 website is running locally at http://localhost:8080" -ForegroundColor Green
                Write-Host "⏭️ Skipping Cloudflare tunnel as requested" -ForegroundColor Yellow
            }
            
            # Display status summary
            Write-Host "`n📋 Status Summary:" -ForegroundColor Cyan
            Write-Host "  • Docker Container: ✅ Running (Port 8080)" -ForegroundColor White
            Write-Host "  • Local Access: http://localhost:8080" -ForegroundColor White
            if (-not $SkipTunnel -and $cloudflaredPath -and (Test-Path $configPath)) {
                Write-Host "  • Public Access: https://itzdevoo.com" -ForegroundColor White
                Write-Host "  • Health Check: https://health.itzdevoo.com" -ForegroundColor White
            }
            
            # Show useful commands
            Write-Host "`n🔧 Useful Commands:" -ForegroundColor Cyan
            Write-Host "  • View logs: docker-compose logs -f" -ForegroundColor White
            Write-Host "  • Stop website: .\stop-website.ps1" -ForegroundColor White
            Write-Host "  • Rebuild: docker-compose up -d --build" -ForegroundColor White
            
        } else {
            Write-Host "❌ Container failed to become healthy within $timeout seconds" -ForegroundColor Red
            Write-Host "🔍 Check container logs: docker-compose logs itzdevoo-website" -ForegroundColor Yellow
            exit 1
        }
        
    } else {
        Write-Host "❌ Failed to start Docker container" -ForegroundColor Red
        Write-Host "🔍 Check Docker Compose logs for details" -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "❌ Error starting website: $_" -ForegroundColor Red
    Write-Verbose "Full error details: $($_.Exception | Format-List -Force | Out-String)"
    exit 1
}

Write-Host "`n🎉 website startup complete!" -ForegroundColor Green