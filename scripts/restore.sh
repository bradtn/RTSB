#!/bin/bash

# Database restore script for Shift Bidding System
# Usage: ./scripts/restore.sh <backup_file>

set -e

if [ $# -eq 0 ]; then
    echo "❌ Please provide a backup file to restore"
    echo "Usage: ./scripts/restore.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -la backups/*.sql.gz 2>/dev/null || echo "No backups found in backups/ directory"
    exit 1
fi

BACKUP_FILE="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔄 Restoring database from: $BACKUP_FILE"

cd "$PROJECT_DIR"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Warning message
echo "⚠️  WARNING: This will completely replace the current database!"
echo "📁 Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Stop application containers but keep database
echo "⏹️  Stopping application containers..."
docker-compose stop app websocket nginx

# Ensure database is running
echo "🗄️  Ensuring database is running..."
docker-compose up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=30
while ! docker-compose exec -T postgres pg_isready -U shift_user -d shift_bidding &>/dev/null; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        echo "❌ Database failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Restore database
echo "📥 Restoring database..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker-compose exec -T postgres psql -U shift_user -d postgres
else
    cat "$BACKUP_FILE" | docker-compose exec -T postgres psql -U shift_user -d postgres
fi

# Run any pending migrations
echo "📊 Running database migrations..."
docker-compose run --rm app npx prisma migrate deploy

echo "✅ Database restore completed successfully!"
echo ""
echo "🚀 Starting application..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Health check
if curl -s -k https://localhost/api/health > /dev/null; then
    echo "✅ Application is running and healthy!"
else
    echo "⚠️  Application started but health check failed. Check logs:"
    echo "   docker-compose logs -f"
fi

echo ""
echo "🎉 Restore completed successfully!"
echo "🌐 Application: https://localhost"