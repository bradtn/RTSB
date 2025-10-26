#!/bin/bash

# Manual backup script for Shift Bidding System
# Usage: ./scripts/backup.sh [backup_name]

set -e

BACKUP_NAME=${1:-"manual_$(date +%Y%m%d_%H%M%S)"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📦 Creating manual backup: $BACKUP_NAME"

cd "$PROJECT_DIR"

# Create backup directory
mkdir -p backups

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ No containers are running. Please start the application first."
    exit 1
fi

# Create database backup
echo "🗄️  Backing up database..."
docker-compose exec -T postgres pg_dump \
    --no-password --clean --if-exists --create \
    --host="localhost" \
    --username="shift_user" \
    --dbname="shift_bidding" \
    > "backups/${BACKUP_NAME}.sql"

# Compress backup
gzip "backups/${BACKUP_NAME}.sql"

# Get file size
BACKUP_SIZE=$(du -h "backups/${BACKUP_NAME}.sql.gz" | cut -f1)

echo "✅ Backup completed successfully!"
echo "📁 File: backups/${BACKUP_NAME}.sql.gz"
echo "📊 Size: $BACKUP_SIZE"
echo ""
echo "💡 To restore this backup:"
echo "   1. Stop the application: docker-compose down"
echo "   2. Start only the database: docker-compose up -d postgres"
echo "   3. Restore: gunzip -c backups/${BACKUP_NAME}.sql.gz | docker-compose exec -T postgres psql -U shift_user -d shift_bidding"
echo "   4. Start the application: docker-compose up -d"