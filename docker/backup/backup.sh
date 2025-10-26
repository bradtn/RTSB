#!/bin/bash

# Database backup script for Shift Bidding System
# Runs daily via cron job in the backup container

set -e

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="shift_bidding_backup_${TIMESTAMP}.sql"
MAX_BACKUPS=7  # Keep last 7 days

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date)"

# Create database dump
pg_dump --no-password --clean --if-exists --create \
    --host="$PGHOST" \
    --username="$PGUSER" \
    --dbname="$PGDATABASE" \
    > "$BACKUP_DIR/$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_DIR/$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "Backup created: $BACKUP_FILE"

# Remove old backups (keep only the last MAX_BACKUPS)
cd "$BACKUP_DIR"
ls -t shift_bidding_backup_*.sql.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f

echo "Cleanup completed. Keeping last $MAX_BACKUPS backups."

# List current backups
echo "Current backups:"
ls -lah shift_bidding_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo "Backup completed at $(date)"