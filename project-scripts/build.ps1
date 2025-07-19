# Enhanced Build Script for ItzDevoo Website
param(
    [string]$Environment = "development",
    [switch]$NoBuild = $false,
    [switch]$NoCache = $false,
    [switch]$Verbose = $false,
    [switch]$Push = $false,
    [string]$Registry = "",
    [string]$Tag = "latest"
)

if ($Verbose) {
    $VerbosePreference = "Continue"
}

$ErrorActionPreference = "Stop"

# Build configuration
$BuildConfig = @{
    ImageName = "itzdevoo-website"
    ContainerName = "itzdevoo-website"
    Port = 8080
    BuildDate = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    GitCommit = ""
    Version = "1.0.0"
}

# Get Git commit hash if available
try {
    $BuildConfig.GitCommit = git rev-parse --short HEAD 2>$null
    if ($LASTEXITCODE -ne 0) {
        $BuildConfig.GitCommit = "unknown"
    }
} catch {
    $BuildConfig.GitCommit = "unknown"
}

Write-Host "🚀 Building ItzDevoo Website" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Version: $($BuildConfig.Version)" -ForegroundColor Cyan
Write-Host "Git Commit: $($BuildConfig.GitCommit)" -ForegroundColor Cyan
Write-Host "Build Date: $($BuildConfig.BuildDate)" -ForegroundColor Cyan

try {
    # Pre-build checks
    Write-Host "`n🔍 Pre-build checks..." -ForegroundColor Yellow
    
    # Check Docker
    Write-Verbose "Checking Docker availability..."
    docker --version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker is not available. Please install Docker Desktop."
    }
    Write-Host "✅ Docker is available" -ForegroundColor Green
    
    # Check Docker daemon
    Write-Verbose "Checking Docker daemon..."
    docker info | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker daemon is not running. Please start Docker Desktop."
    }
    Write-Host "✅ Docker daemon is running" -ForegroundColor Green
    
    # Check required files
    $RequiredFiles = @("Dockerfile", "docker-compose.yml", "nginx.conf", "index.html")
    foreach ($file in $RequiredFiles) {
        if (-not (Test-Path $file)) {
            throw "Required file missing: $file"
        }
    }
    Write-Host "✅ All required files present" -ForegroundColor Green
    
    # Stop existing container if running
    Write-Host "`n🛑 Stopping existing containers..." -ForegroundColor Yellow
    docker-compose down 2>$null
    Write-Verbose "Existing containers stopped"
    
    if (-not $NoBuild) {
        # Build Docker image
        Write-Host "`n🔨 Building Docker image..." -ForegroundColor Yellow
        
        $BuildArgs = @(
            "build"
            "-t", "$($BuildConfig.ImageName):$Tag"
            "-t", "$($BuildConfig.ImageName):$($BuildConfig.GitCommit)"
            "--build-arg", "BUILD_DATE=$($BuildConfig.BuildDate)"
            "--build-arg", "VCS_REF=$($BuildConfig.GitCommit)"
            "--build-arg", "VERSION=$($BuildConfig.Version)"
            "--label", "org.opencontainers.image.created=$($BuildConfig.BuildDate)"
            "--label", "org.opencontainers.image.revision=$($BuildConfig.GitCommit)"
            "--label", "org.opencontainers.image.version=$($BuildConfig.Version)"
        )
        
        if ($NoCache) {
            $BuildArgs += "--no-cache"
            Write-Verbose "Building without cache"
        }
        
        if ($Verbose) {
            $BuildArgs += "--progress=plain"
        }
        
        $BuildArgs += "."
        
        Write-Verbose "Docker build command: docker $($BuildArgs -join ' ')"
        & docker @BuildArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
            
            # Show image info
            $ImageInfo = docker images "$($BuildConfig.ImageName):$Tag" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
            Write-Host "`n📦 Image Information:" -ForegroundColor Cyan
            Write-Host $ImageInfo -ForegroundColor White
            
        } else {
            throw "Failed to build Docker image"
        }
        
        # Push to registry if requested
        if ($Push -and $Registry) {
            Write-Host "`n📤 Pushing to registry..." -ForegroundColor Yellow
            
            $RegistryImage = "$Registry/$($BuildConfig.ImageName):$Tag"
            docker tag "$($BuildConfig.ImageName):$Tag" $RegistryImage
            docker push $RegistryImage
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Image pushed to registry: $RegistryImage" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Failed to push image to registry" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "⏭️ Skipping build as requested" -ForegroundColor Yellow
    }
    
    # Start the container
    Write-Host "`n🚀 Starting container..." -ForegroundColor Yellow
    
    # Set environment variables for docker-compose
    $env:BUILD_DATE = $BuildConfig.BuildDate
    $env:VCS_REF = $BuildConfig.GitCommit
    $env:VERSION = $BuildConfig.Version
    
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Container started successfully!" -ForegroundColor Green
        
        # Wait for container to be healthy
        Write-Host "`n⏳ Waiting for container to be healthy..." -ForegroundColor Yellow
        $timeout = 60
        $elapsed = 0
        
        do {
            Start-Sleep -Seconds 2
            $elapsed += 2
            $health = docker inspect --format='{{.State.Health.Status}}' $BuildConfig.ContainerName 2>$null
            Write-Verbose "Health status: $health (${elapsed}s elapsed)"
        } while ($health -ne "healthy" -and $elapsed -lt $timeout)
        
        if ($health -eq "healthy") {
            Write-Host "✅ Container is healthy!" -ForegroundColor Green
            
            # Test connectivity
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$($BuildConfig.Port)/health" -TimeoutSec 10
                Write-Host "✅ Health check passed (Status: $($response.StatusCode))" -ForegroundColor Green
            } catch {
                Write-Host "⚠️ Health check endpoint not responding, but container is healthy" -ForegroundColor Yellow
            }
            
        } else {
            Write-Host "⚠️ Container may not be fully ready yet" -ForegroundColor Yellow
        }
        
        # Display status and useful information
        Write-Host "`n🎉 Build Complete!" -ForegroundColor Green
        Write-Host "📋 Status Summary:" -ForegroundColor Cyan
        Write-Host "  • Environment: $Environment" -ForegroundColor White
        Write-Host "  • Image: $($BuildConfig.ImageName):$Tag" -ForegroundColor White
        Write-Host "  • Container: $($BuildConfig.ContainerName)" -ForegroundColor White
        Write-Host "  • Local URL: http://localhost:$($BuildConfig.Port)" -ForegroundColor White
        Write-Host "  • Health Check: http://localhost:$($BuildConfig.Port)/health" -ForegroundColor White
        
        Write-Host "`n🔧 Useful Commands:" -ForegroundColor Cyan
        Write-Host "  • View logs: docker-compose logs -f" -ForegroundColor White
        Write-Host "  • Stop: docker-compose down" -ForegroundColor White
        Write-Host "  • Restart: docker-compose restart" -ForegroundColor White
        Write-Host "  • Shell access: docker exec -it $($BuildConfig.ContainerName) sh" -ForegroundColor White
        
        if ($Environment -eq "production") {
            Write-Host "`n🌐 Production Deployment:" -ForegroundColor Cyan
            Write-Host "  • Start with tunnel: .\start-website.ps1" -ForegroundColor White
            Write-Host "  • Stop everything: .\stop-website.ps1" -ForegroundColor White
        }
        
    } else {
        throw "Failed to start container"
    }
    
} catch {
    Write-Host "`n❌ Build failed: $_" -ForegroundColor Red
    Write-Verbose "Full error: $($_.Exception | Format-List -Force | Out-String)"
    
    # Show container logs if available
    $containerLogs = docker-compose logs --tail=20 2>$null
    if ($containerLogs) {
        Write-Host "`n📋 Recent container logs:" -ForegroundColor Yellow
        Write-Host $containerLogs -ForegroundColor Gray
    }
    
    exit 1
}