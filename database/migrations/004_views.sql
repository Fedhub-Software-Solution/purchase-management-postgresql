-- ============================================
-- Views for Reporting
-- ============================================

-- Client Summary View
CREATE OR REPLACE VIEW client_summary AS
SELECT 
    c.id,
    c.company,
    c.contact_person,
    c.status,
    COUNT(DISTINCT p.id) as total_purchases,
    COUNT(DISTINCT i.id) as total_invoices,
    COALESCE(SUM(i.total), 0) as total_revenue
FROM clients c
LEFT JOIN purchases p ON p.client_id = c.id
LEFT JOIN invoices i ON i.client_id = c.id
GROUP BY c.id, c.company, c.contact_person, c.status;

