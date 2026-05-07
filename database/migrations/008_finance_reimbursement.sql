-- Optional reimbursement fields for finance records
ALTER TABLE finance_records
  ADD COLUMN IF NOT EXISTS amount_spent_by VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS reimbursed_amount DECIMAL(15, 2);

COMMENT ON COLUMN finance_records.amount_spent_by IS 'Optional: who the amount was spent by';
COMMENT ON COLUMN finance_records.reimbursed_amount IS 'Optional: portion already reimbursed; pending = amount - coalesce(reimbursed_amount,0)';
