# Database Schema Documentation

Complete database structure, relationships, and design decisions for the Purchase Management System.

## Overview

The database uses PostgreSQL 14+ with:
- UUID primary keys
- Foreign key constraints
- Check constraints for data validation
- Triggers for automatic timestamp updates
- Functions for business logic
- Views for reporting

## Database: `purchase_management`

## Tables

### 1. users

Authentication and user management.

**Columns:**
- `id` (UUID, PK) - Primary key
- `email` (VARCHAR(255), UNIQUE, NOT NULL) - User email
- `password_hash` (VARCHAR(255), NOT NULL) - Bcrypt hashed password
- `role` (VARCHAR(50), NOT NULL) - User role: `admin` | `employee`
- `name` (VARCHAR(255), NOT NULL) - User display name
- `active` (BOOLEAN, DEFAULT true) - Account status
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Indexes:**
- `idx_users_email` - Fast email lookups
- `idx_users_active` - Filter active users

**Relationships:**
- None (standalone authentication table)

---

### 2. clients

Client/customer information.

**Columns:**
- `id` (UUID, PK) - Primary key
- `company` (VARCHAR(255), NOT NULL) - Company name
- `contact_person` (VARCHAR(255), NOT NULL) - Contact person name
- `email` (VARCHAR(255), NOT NULL) - Contact email
- `phone` (VARCHAR(50), NOT NULL) - Contact phone
- `status` (VARCHAR(20), NOT NULL) - Status: `active` | `inactive`
- `gst_number` (VARCHAR(50), DEFAULT '') - GST registration number
- `msme_number` (VARCHAR(50), DEFAULT '') - MSME registration number
- `pan_number` (VARCHAR(50), DEFAULT '') - PAN number
- `billing_address_street` (VARCHAR(255), NOT NULL) - Billing street
- `billing_address_city` (VARCHAR(100), NOT NULL) - Billing city
- `billing_address_state` (VARCHAR(100), NOT NULL) - Billing state
- `billing_address_postal_code` (VARCHAR(20), NOT NULL) - Billing postal code
- `billing_address_country` (VARCHAR(100), NOT NULL) - Billing country
- `shipping_address_street` (VARCHAR(255), NOT NULL) - Shipping street
- `shipping_address_city` (VARCHAR(100), NOT NULL) - Shipping city
- `shipping_address_state` (VARCHAR(100), NOT NULL) - Shipping state
- `shipping_address_postal_code` (VARCHAR(20), NOT NULL) - Shipping postal code
- `shipping_address_country` (VARCHAR(100), NOT NULL) - Shipping country
- `notes` (TEXT, DEFAULT '') - Additional notes
- `base_currency` (VARCHAR(10), NOT NULL, DEFAULT 'INR') - Base currency
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Indexes:**
- `idx_clients_status` - Filter by status
- `idx_clients_company` - Search by company name
- `idx_clients_created_at` - Sort by creation date

**Relationships:**
- One-to-many with `purchases`
- One-to-many with `invoices`

---

### 3. purchases

Purchase orders.

**Columns:**
- `id` (UUID, PK) - Primary key
- `client_id` (UUID, FK → clients.id, NOT NULL) - Reference to client
- `po_number` (VARCHAR(100), NOT NULL) - Purchase order number
- `date` (DATE, NOT NULL) - Purchase order date
- `status` (VARCHAR(20), NOT NULL) - Status: `draft` | `approved` | `pending` | `rejected`
- `subtotal` (DECIMAL(15, 2), NOT NULL, DEFAULT 0) - Subtotal amount
- `tax` (DECIMAL(15, 2), NOT NULL, DEFAULT 0) - Tax amount
- `total` (DECIMAL(15, 2), NOT NULL, DEFAULT 0) - Total amount
- `base_currency` (VARCHAR(10), NOT NULL, DEFAULT 'INR') - Base currency
- `notes` (TEXT, DEFAULT '') - Additional notes
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Indexes:**
- `idx_purchases_client_id` - Fast client lookups
- `idx_purchases_status` - Filter by status
- `idx_purchases_po_number` - Search by PO number
- `idx_purchases_created_at` - Sort by creation date
- `idx_purchases_date` - Filter by date

**Relationships:**
- Many-to-one with `clients`
- One-to-many with `purchase_items`
- Many-to-many with `invoices` (via `invoice_purchases`)

---

### 4. purchase_items

Items in purchase orders.

**Columns:**
- `id` (UUID, PK) - Primary key
- `purchase_id` (UUID, FK → purchases.id, NOT NULL) - Reference to purchase
- `name` (VARCHAR(255), NOT NULL) - Item name/description
- `model` (VARCHAR(255), DEFAULT '') - Item model
- `supplier` (VARCHAR(255), DEFAULT '') - Supplier name
- `quantity` (DECIMAL(10, 2), NOT NULL, DEFAULT 0) - Quantity
- `unit_price` (DECIMAL(15, 2), NOT NULL, DEFAULT 0) - Unit price
- `uom` (VARCHAR(50), DEFAULT '') - Unit of measure
- `currency` (VARCHAR(10), NOT NULL, DEFAULT 'INR') - Currency
- `total` (DECIMAL(15, 2), NOT NULL, DEFAULT 0) - Line total (quantity × unit_price)
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp

**Indexes:**
- `idx_purchase_items_purchase_id` - Fast purchase lookups

**Relationships:**
- Many-to-one with `purchases`

---

### 5. invoices

Invoice records.

**Columns:**
- `id` (UUID, PK) - Primary key
- `client_id` (UUID, FK → clients.id, NOT NULL) - Reference to client
- `invoice_number` (VARCHAR(100), UNIQUE, NOT NULL) - Invoice number (auto-generated)
- `date` (DATE, NOT NULL) - Invoice date
- `due_date` (DATE, NOT NULL) - Due date
- `status` (VARCHAR(20), NOT NULL) - Status: `draft` | `sent` | `paid` | `overdue`
- `subtotal` (DECIMAL(15, 2), NOT NULL, DEFAULT 0) - Subtotal amount
- `tax` (DECIMAL(15, 2), NOT NULL, DEFAULT 0) - Tax amount
- `total` (DECIMAL(15, 2), NOT NULL, DEFAULT 0) - Total amount
- `payment_terms` (VARCHAR(50), DEFAULT '30') - Payment terms in days
- `notes` (TEXT, DEFAULT '') - Additional notes
- `base_currency` (VARCHAR(10), NOT NULL, DEFAULT 'INR') - Base currency
- `paid_at` (TIMESTAMP WITH TIME ZONE, NULL) - Payment timestamp
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Indexes:**
- `idx_invoices_client_id` - Fast client lookups
- `idx_invoices_status` - Filter by status
- `idx_invoices_invoice_number` - Search by invoice number
- `idx_invoices_created_at` - Sort by creation date
- `idx_invoices_due_date` - Filter by due date

**Relationships:**
- Many-to-one with `clients`
- One-to-many with `invoice_items`
- Many-to-many with `purchases` (via `invoice_purchases`)

---

### 6. invoice_items

Items in invoices.

**Columns:**
- `id` (UUID, PK) - Primary key
- `invoice_id` (UUID, FK → invoices.id, NOT NULL) - Reference to invoice
- `purchase_id` (UUID, FK → purchases.id, NULL) - Reference to source purchase
- `po_number` (VARCHAR(100), DEFAULT '') - Purchase order number
- `name` (VARCHAR(255), NOT NULL) - Item name/description
- `model` (VARCHAR(255), DEFAULT '') - Item model
- `supplier` (VARCHAR(255), DEFAULT '') - Supplier name
- `quantity` (DECIMAL(10, 2), NOT NULL, DEFAULT 0) - Quantity
- `unit_price` (DECIMAL(15, 2), NOT NULL, DEFAULT 0) - Unit price
- `uom` (VARCHAR(50), DEFAULT '') - Unit of measure
- `currency` (VARCHAR(10), NOT NULL, DEFAULT 'INR') - Currency
- `total` (DECIMAL(15, 2), NOT NULL, DEFAULT 0) - Line total
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp

**Indexes:**
- `idx_invoice_items_invoice_id` - Fast invoice lookups
- `idx_invoice_items_purchase_id` - Link to source purchase

**Relationships:**
- Many-to-one with `invoices`
- Many-to-one with `purchases` (optional, for tracking source)

---

### 7. invoice_purchases

Many-to-many relationship between invoices and purchases.

**Columns:**
- `invoice_id` (UUID, FK → invoices.id, NOT NULL) - Reference to invoice
- `purchase_id` (UUID, FK → purchases.id, NOT NULL) - Reference to purchase
- **Primary Key:** (`invoice_id`, `purchase_id`)

**Indexes:**
- `idx_invoice_purchases_invoice_id` - Fast invoice lookups
- `idx_invoice_purchases_purchase_id` - Fast purchase lookups

**Relationships:**
- Links `invoices` and `purchases` (many-to-many)

---

### 8. finance_records

Financial transactions (income and expenses).

**Columns:**
- `id` (UUID, PK) - Primary key
- `type` (VARCHAR(20), NOT NULL) - Type: `invested` | `expense` | `tds`
- `category` (VARCHAR(100), NOT NULL) - Transaction category
- `amount` (DECIMAL(15, 2), NOT NULL, DEFAULT 0) - Transaction amount
- `description` (TEXT, DEFAULT '') - Transaction description
- `date` (DATE, NOT NULL) - Transaction date
- `payment_method` (VARCHAR(100), DEFAULT '') - Payment method
- `status` (VARCHAR(20), NOT NULL) - Status: `completed` | `pending` | `failed`
- `reference` (VARCHAR(255), DEFAULT '') - Reference number
- `tax_year` (VARCHAR(10), DEFAULT '') - Tax year
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Indexes:**
- `idx_finance_records_type` - Filter by type
- `idx_finance_records_category` - Filter by category
- `idx_finance_records_status` - Filter by status
- `idx_finance_records_date` - Sort by date
- `idx_finance_records_created_at` - Sort by creation date

**Relationships:**
- None (standalone financial records)

---

### 9. settings

Application settings stored as JSONB.

**Columns:**
- `id` (UUID, PK) - Primary key
- `key` (VARCHAR(100), UNIQUE, NOT NULL) - Setting key
- `value` (JSONB, NOT NULL) - Setting value (JSON object)
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Default Settings:**
- Key: `current`
- Value: JSON object containing:
  - Company information
  - Tax rates
  - Payment terms
  - UI preferences
  - Notification settings

**Relationships:**
- None (application configuration)

---

### 10. invoice_sequence

Invoice number sequence counter (per year).

**Columns:**
- `id` (UUID, PK) - Primary key
- `year` (INTEGER, UNIQUE, NOT NULL) - Year
- `sequence` (INTEGER, NOT NULL, DEFAULT 0) - Current sequence number
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Indexes:**
- `idx_invoice_sequence_year` - Fast year lookups

**Purpose:**
- Tracks invoice number sequence per year
- Used by `next_invoice_number()` function

---

## Database Functions

### next_invoice_number()

Generates the next invoice number in format: `INV-YYYY-NNNN`

**Logic:**
1. Get current year
2. Insert or update sequence for current year
3. Increment sequence
4. Return formatted invoice number

**Usage:**
```sql
SELECT next_invoice_number();
-- Returns: INV-2025-0001
```

---

## Database Triggers

### Auto-update Timestamps

All tables with `updated_at` columns have triggers that automatically update the timestamp on row updates.

**Trigger Pattern:**
```sql
CREATE TRIGGER update_<table>_updated_at
BEFORE UPDATE ON <table>
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Affected Tables:**
- `users`
- `clients`
- `purchases`
- `invoices`
- `finance_records`
- `settings`
- `invoice_sequence`

---

## Database Views

### client_summary

Aggregated client statistics view.

**Columns:**
- `id` - Client ID
- `company` - Company name
- `contact_person` - Contact person
- `status` - Client status
- `total_purchases` - Count of purchase orders
- `total_invoices` - Count of invoices
- `total_revenue` - Sum of invoice totals

**Usage:**
```sql
SELECT * FROM client_summary WHERE status = 'active';
```

---

## Entity Relationships

```
users (standalone)
    │
clients ──┬── purchases ──┬── purchase_items
          │              │
          │              └── invoice_purchases ──┐
          │                                     │
          └── invoices ──┬── invoice_items     │
                         │                     │
                         └─────────────────────┘
                         
finance_records (standalone)
settings (standalone)
invoice_sequence (standalone)
```

## Data Integrity

### Foreign Key Constraints

- `purchases.client_id` → `clients.id` (CASCADE DELETE)
- `purchase_items.purchase_id` → `purchases.id` (CASCADE DELETE)
- `invoices.client_id` → `clients.id` (CASCADE DELETE)
- `invoice_items.invoice_id` → `invoices.id` (CASCADE DELETE)
- `invoice_items.purchase_id` → `purchases.id` (SET NULL)
- `invoice_purchases.invoice_id` → `invoices.id` (CASCADE DELETE)
- `invoice_purchases.purchase_id` → `purchases.id` (CASCADE DELETE)

### Check Constraints

- `users.role` IN ('admin', 'employee')
- `clients.status` IN ('active', 'inactive')
- `purchases.status` IN ('draft', 'approved', 'pending', 'rejected')
- `invoices.status` IN ('draft', 'sent', 'paid', 'overdue')
- `finance_records.type` IN ('invested', 'expense', 'tds')
- `finance_records.status` IN ('completed', 'pending', 'failed')

### Unique Constraints

- `users.email` - Unique email addresses
- `invoices.invoice_number` - Unique invoice numbers
- `settings.key` - Unique setting keys
- `invoice_sequence.year` - One sequence per year

## Indexes Strategy

Indexes are created on:
- Foreign keys (for join performance)
- Status columns (for filtering)
- Searchable columns (company name, PO number, invoice number)
- Date columns (for sorting and filtering)
- Email (for authentication lookups)

## Migration Strategy

Migrations are numbered and run in order:
1. `001_initial_schema.sql` - Tables and indexes
2. `002_triggers.sql` - Auto-update triggers
3. `003_functions.sql` - Database functions
4. `004_views.sql` - Reporting views

## Backup and Recovery

### Backup
```bash
pg_dump -U postgres purchase_management > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql -U postgres purchase_management < backup_YYYYMMDD.sql
```

## Performance Considerations

- Connection pooling (max 20 connections)
- Indexed foreign keys for fast joins
- Indexed status columns for filtering
- Indexed date columns for sorting
- JSONB for flexible settings storage
- Efficient sequence generation for invoice numbers

