# Build script for ItzDevoo Portfolio
param(
    [string]$Environment = "development"
)

Write-Host "Building ItzDevoo Portfolio for $Environment environment..." -ForegroundColor Green

# Build Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t itzdevoo-portfolio:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker image built successfully!" -ForegroundColor Green
    
    # Run the container
    Write-Host "Starting container..." -ForegroundColor Yellow
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Portfolio is now running at http://localhost:8080" -ForegroundColor Green
        Write-Host "Container logs: docker-compose logs -f" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to start container" -ForegroundColor Red
    }
} else {
    Write-Host "Failed to build Docker image" -ForegroundColor Red
}