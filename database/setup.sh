#!/bin/bash

# Database Setup Script
# This script creates the database and runs all migrations

set -e

DB_NAME="purchase_management"
DB_USER="${DB_USER:-postgres}"

echo "=========================================="
echo "Purchase Management Database Setup"
echo "=========================================="

# Check if database exists
if psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "Database '$DB_NAME' already exists."
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping database..."
        psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
        echo "Creating database..."
        psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
    else
        echo "Using existing database."
    fi
else
    echo "Creating database..."
    psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
fi

echo "Running migrations..."

# Run migrations in order
psql -U "$DB_USER" -d "$DB_NAME" -f database/migrations/001_initial_schema.sql
echo "✓ Schema created"

psql -U "$DB_USER" -d "$DB_NAME" -f database/migrations/002_triggers.sql
echo "✓ Triggers created"

psql -U "$DB_USER" -d "$DB_NAME" -f database/migrations/003_functions.sql
echo "✓ Functions created"

psql -U "$DB_USER" -d "$DB_NAME" -f database/migrations/004_views.sql
echo "✓ Views created"

echo ""
echo "=========================================="
echo "Database setup complete!"
echo "=========================================="
echo ""
echo "You can now:"
echo "1. Update backend/.env.local-only with database credentials"
echo "2. Start the backend server"
echo ""

