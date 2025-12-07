# Database Setup Script for Windows PowerShell
# This script creates the database and runs all migrations

$DB_NAME = "purchase_management"
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }

Write-Host "=========================================="
Write-Host "Purchase Management Database Setup"
Write-Host "=========================================="

# Check if database exists
$dbExists = psql -U $DB_USER -lqt | Select-String -Pattern $DB_NAME

if ($dbExists) {
    Write-Host "Database '$DB_NAME' already exists."
    $response = Read-Host "Do you want to drop and recreate it? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "Dropping database..."
        psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
        Write-Host "Creating database..."
        psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
    } else {
        Write-Host "Using existing database."
    }
} else {
    Write-Host "Creating database..."
    psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
}

Write-Host "Running migrations..."

# Run migrations in order
psql -U $DB_USER -d $DB_NAME -f database\migrations\001_initial_schema.sql
Write-Host "✓ Schema created"

psql -U $DB_USER -d $DB_NAME -f database\migrations\002_triggers.sql
Write-Host "✓ Triggers created"

psql -U $DB_USER -d $DB_NAME -f database\migrations\003_functions.sql
Write-Host "✓ Functions created"

psql -U $DB_USER -d $DB_NAME -f database\migrations\004_views.sql
Write-Host "✓ Views created"

Write-Host ""
Write-Host "=========================================="
Write-Host "Database setup complete!"
Write-Host "=========================================="
Write-Host ""
Write-Host "You can now:"
Write-Host "1. Update backend\.env.local-only with database credentials"
Write-Host "2. Start the backend server"
Write-Host ""

