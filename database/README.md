# Database Setup

This directory contains all database migration scripts and schema definitions.

## Setup Instructions

### 1. Create Database

```bash
psql -U postgres

CREATE DATABASE purchase_management;
\q
```

### 2. Run Migrations

Run migrations in order:

```bash
# From project root
psql -U postgres -d purchase_management -f database/migrations/001_initial_schema.sql
psql -U postgres -d purchase_management -f database/migrations/002_triggers.sql
psql -U postgres -d purchase_management -f database/migrations/003_functions.sql
psql -U postgres -d purchase_management -f database/migrations/004_views.sql
```

### 3. Verify Setup

```bash
psql -U postgres -d purchase_management

# Check tables
\dt

# Check a table structure
\d clients

# Test invoice number function
SELECT next_invoice_number();

# Exit
\q
```

## Migration Files

- **001_initial_schema.sql** - Creates all tables, indexes, and default data
- **002_triggers.sql** - Creates triggers for auto-updating timestamps
- **003_functions.sql** - Creates database functions (e.g., invoice number generation)
- **004_views.sql** - Creates views for reporting

## Database Structure

### Core Tables
- `users` - Authentication and user management
- `clients` - Client/customer information
- `purchases` - Purchase orders
- `purchase_items` - Items in purchase orders
- `invoices` - Invoice records
- `invoice_items` - Items in invoices
- `invoice_purchases` - Many-to-many relation between invoices and purchases
- `finance_records` - Financial transactions
- `settings` - Application settings (JSONB)
- `invoice_sequence` - Invoice number sequence counter

## Default Data

The schema includes:
- Default settings in `settings` table
- No default users (created via backend seed function)

## Backup and Restore

### Backup
```bash
pg_dump -U postgres purchase_management > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql -U postgres purchase_management < backup_YYYYMMDD.sql
```

