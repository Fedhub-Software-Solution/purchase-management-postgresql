ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS pan_number VARCHAR(50) DEFAULT '';

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE purchases
  ALTER COLUMN client_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
