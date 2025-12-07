-- ============================================
-- Database Functions
-- ============================================

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER;
    next_seq INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    INSERT INTO invoice_sequence (year, sequence)
    VALUES (current_year, 1)
    ON CONFLICT (year) DO UPDATE
    SET sequence = invoice_sequence.sequence + 1,
        updated_at = CURRENT_TIMESTAMP
    RETURNING sequence INTO next_seq;
    
    RETURN 'INV-' || current_year || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

