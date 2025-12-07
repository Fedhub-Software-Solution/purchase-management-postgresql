-- ============================================
-- Purchase Management System - Initial Schema
-- ============================================
-- This script creates all tables, indexes, and constraints
-- Run this after creating the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Users Table (Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'employee')),
    name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- ============================================
-- 2. Clients Table
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive')),
    gst_number VARCHAR(50) DEFAULT '',
    msme_number VARCHAR(50) DEFAULT '',
    pan_number VARCHAR(50) DEFAULT '',
    billing_address_street VARCHAR(255) NOT NULL,
    billing_address_city VARCHAR(100) NOT NULL,
    billing_address_state VARCHAR(100) NOT NULL,
    billing_address_postal_code VARCHAR(20) NOT NULL,
    billing_address_country VARCHAR(100) NOT NULL,
    shipping_address_street VARCHAR(255) NOT NULL,
    shipping_address_city VARCHAR(100) NOT NULL,
    shipping_address_state VARCHAR(100) NOT NULL,
    shipping_address_postal_code VARCHAR(20) NOT NULL,
    shipping_address_country VARCHAR(100) NOT NULL,
    notes TEXT DEFAULT '',
    base_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- ============================================
-- 3. Purchases Table
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    po_number VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'approved', 'pending', 'rejected')),
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    base_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchases_client_id ON purchases(client_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_po_number ON purchases(po_number);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);

-- ============================================
-- 4. Purchase Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255) DEFAULT '',
    supplier VARCHAR(255) DEFAULT '',
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    uom VARCHAR(50) DEFAULT '',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);

-- ============================================
-- 5. Invoices Table
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    payment_terms VARCHAR(50) DEFAULT '30',
    notes TEXT DEFAULT '',
    base_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- ============================================
-- 6. Invoice Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    po_number VARCHAR(100) DEFAULT '',
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255) DEFAULT '',
    supplier VARCHAR(255) DEFAULT '',
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    uom VARCHAR(50) DEFAULT '',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_purchase_id ON invoice_items(purchase_id);

-- ============================================
-- 7. Invoice Purchase Relations Table
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_purchases (
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    PRIMARY KEY (invoice_id, purchase_id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_purchases_invoice_id ON invoice_purchases(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_purchases_purchase_id ON invoice_purchases(purchase_id);

-- ============================================
-- 8. Finance Records Table
-- ============================================
CREATE TABLE IF NOT EXISTS finance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('invested', 'expense', 'tds')),
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    description TEXT DEFAULT '',
    date DATE NOT NULL,
    payment_method VARCHAR(100) DEFAULT '',
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'pending', 'failed')),
    reference VARCHAR(255) DEFAULT '',
    tax_year VARCHAR(10) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_finance_records_type ON finance_records(type);
CREATE INDEX IF NOT EXISTS idx_finance_records_category ON finance_records(category);
CREATE INDEX IF NOT EXISTS idx_finance_records_status ON finance_records(status);
CREATE INDEX IF NOT EXISTS idx_finance_records_date ON finance_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_records_created_at ON finance_records(created_at DESC);

-- ============================================
-- 9. Settings Table
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. Invoice Sequence Counter Table
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_sequence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    sequence INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year)
);

CREATE INDEX IF NOT EXISTS idx_invoice_sequence_year ON invoice_sequence(year);

-- ============================================
-- Insert Default Settings
-- ============================================
INSERT INTO settings (key, value) VALUES ('current', '{
    "theme": "light",
    "sidebarCollapsed": false,
    "emailNotifications": true,
    "pushNotifications": false,
    "invoiceReminders": true,
    "companyName": "FedHub Software Solutions",
    "companyEmail": "info@fedhubsoftware.com",
    "companyPhone": "+91 9003285428",
    "companyAddress": "P No 69,70 Gokula Nandhana, Gokul Nagar, Hosur, Krishnagiri-DT, Tamilnadu, India-635109",
    "companyGST": "33AACCF2123P1Z5",
    "companyPAN": "AACCF2123P",
    "companyMSME": "UDYAM-TN-06-0012345",
    "defaultTaxRate": 18,
    "defaultPaymentTerms": 30,
    "invoicePrefix": "INV",
    "twoFactorAuth": false,
    "sessionTimeout": 60
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

