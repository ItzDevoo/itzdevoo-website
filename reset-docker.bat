@echo off
echo 🧹 Resetting Docker setup for ItzDevoo website...

echo.
echo 🛑 Stopping and removing containers...
docker-compose down

echo.
echo 🗑️ Removing Docker image...
docker rmi itzdevoo-website 2>nul

echo.
echo 🧽 Pruning build cache...
docker builder prune -f

echo.
echo 📦 Rebuilding from scratch...
docker-compose build --no-cache

echo.
echo 🚀 Starting fresh containers...
docker-compose up -d

echo.
echo ✅ Docker reset complete!
echo 🌐 Visit: http://localhost:8080
echo 🔧 Health: http://localhost:8080/health

pause