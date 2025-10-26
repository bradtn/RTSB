#!/bin/bash

# Production deployment script for Shift Bidding System
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Deploying Shift Bidding System to $ENVIRONMENT environment"

# Check if Docker is installed and running
if ! docker --version &> /dev/null; then
    echo "❌ Docker is not installed or not running"
    exit 1
fi

if ! docker-compose --version &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

cd "$PROJECT_DIR"

# Check if environment file exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found"
    echo "📋 Please copy .env.production to .env.local and configure it"
    exit 1
fi

# Generate SSL certificates for development if they don't exist
if [ ! -f "docker/ssl/cert.pem" ] || [ ! -f "docker/ssl/private.key" ]; then
    echo "🔐 Generating self-signed SSL certificates..."
    mkdir -p docker/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout docker/ssl/private.key \
        -out docker/ssl/cert.pem \
        -subj "/C=CA/ST=ON/L=Toronto/O=ShiftBidding/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
    echo "✅ SSL certificates generated"
fi

# Create backup directory
mkdir -p backups

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker-compose pull

# Build application images
echo "🏗️  Building application images..."
docker-compose build --no-cache

# Stop existing containers
echo "⏹️  Stopping existing containers..."
docker-compose down

# Start database first and wait for it to be ready
echo "🗄️  Starting database..."
docker-compose up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=60
while ! docker-compose exec -T postgres pg_isready -U ${DB_USER:-shift_user} -d ${DB_NAME:-shift_bidding} &>/dev/null; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        echo "❌ Database failed to start within 60 seconds"
        docker-compose logs postgres
        exit 1
    fi
    sleep 1
done
echo "✅ Database is ready"

# Run database migrations
echo "📊 Running database migrations..."
docker-compose run --rm app npx prisma migrate deploy

# Check if we need to seed the database
if docker-compose exec -T postgres psql -U ${DB_USER:-shift_user} -d ${DB_NAME:-shift_bidding} -c "SELECT COUNT(*) FROM \"User\";" | grep -q " 0"; then
    echo "🌱 Seeding database with initial data..."
    docker-compose run --rm app npm run prisma:seed
    echo "✅ Database seeded"
else
    echo "📊 Database already contains data, skipping seed"
fi

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Health check
echo "🏥 Performing health checks..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s -k https://localhost/api/health > /dev/null; then
        echo "✅ Application is healthy and running!"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo "Attempt $ATTEMPT/$MAX_ATTEMPTS - waiting for application..."
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "❌ Application health check failed"
    echo "📋 Container logs:"
    docker-compose logs --tail=50
    exit 1
fi

# Display service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📍 Application URLs:"
echo "   🌐 Web App: https://localhost"
echo "   🔌 WebSocket: wss://localhost/socket.io/"
echo "   🏥 Health Check: https://localhost/api/health"
echo ""
echo "👤 Default Login Credentials:"
echo "   🔑 Super Admin: admin@example.com / admin123"
echo "   👮 Supervisor: supervisor@example.com / supervisor123"
echo "   👤 Officer: officer1@example.com / officer123"
echo ""
echo "🛠️  Management Commands:"
echo "   📊 View logs: docker-compose logs -f"
echo "   ⏹️  Stop services: docker-compose down"
echo "   🗄️  Database admin: docker-compose exec postgres psql -U shift_user shift_bidding"
echo "   📋 Container status: docker-compose ps"