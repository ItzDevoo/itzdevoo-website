#!/bin/bash

# Server deployment script for ItzDevoo website
# Run this script on your server to deploy the latest version

echo "🚀 Starting ItzDevoo website deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Make sure you're in the project directory."
    exit 1
fi

print_status "Checking Git repository..."
if [ ! -d ".git" ]; then
    print_error "Not a Git repository. Please clone the repository first."
    exit 1
fi

# Check if Docker is running
print_status "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    print_error "Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Pull latest changes
print_status "Pulling latest changes from Git..."
if git pull origin main; then
    print_success "Git pull completed"
else
    print_error "Git pull failed"
    exit 1
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down

# Build and start new containers
print_status "Building and starting containers..."
if docker-compose up -d --build; then
    print_success "Containers started successfully"
else
    print_error "Failed to start containers"
    exit 1
fi

# Wait a moment for containers to fully start
print_status "Waiting for containers to start..."
sleep 10

# Check container status
print_status "Checking container status..."
docker-compose ps

# Test the deployment
print_status "Testing deployment..."
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    print_success "Health check passed! ✅"
else
    print_warning "Health check failed. Checking logs..."
    docker-compose logs --tail=20
fi

# Show final status
echo ""
echo "🎉 Deployment completed!"
echo "🌐 Website should be available at: http://localhost:8080"
echo "🔧 Health check: http://localhost:8080/health"
echo ""
echo "📋 Useful commands:"
echo "  View logs:    docker-compose logs -f"
echo "  Stop site:    docker-compose down"
echo "  Restart:      docker-compose restart"
echo "  Check status: docker-compose ps"