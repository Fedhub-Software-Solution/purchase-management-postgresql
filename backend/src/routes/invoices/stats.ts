// backend/src/routes/invoices/stats.ts
import { Request, Response } from "express";
import { query } from "../../database.js";
import { handleDbError } from "../../common.js";

/**
 * GET /api/invoices/stats?dateFrom=ISO&dateTo=ISO&clientId=...
 * Returns KPI-style aggregates used by the dashboard.
 */
export async function getInvoiceStats(req: Request, res: Response) {
  try {
    const { dateFrom, dateTo, clientId } = req.query as Record<string, string | undefined>;

    // Default: last 30 days
    const to = dateTo ? new Date(dateTo) : new Date();
    const from = dateFrom ? new Date(dateFrom) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    let sql = `
      SELECT * FROM invoices 
      WHERE created_at >= $1 AND created_at <= $2
    `;
    const params: any[] = [from.toISOString(), to.toISOString()];

    if (clientId) {
      sql += ` AND client_id = $3`;
      params.push(clientId);
    }

    sql += ` ORDER BY created_at DESC`;

    const invoices = await query(sql, params);

    const sum = (arr: any[]) => arr.reduce((s, x) => s + (Number(x.total) || 0), 0);

    const paid = invoices.filter((i) => i.status === "paid");
    const pending = invoices.filter((i) => i.status === "sent" || i.status === "draft");
    const overdue = invoices.filter((i) => i.status === "overdue");

    res.json({
      totalInvoices: invoices.length,
      totalRevenue: sum(invoices),
      paidInvoices: paid.length,
      paidRevenue: sum(paid),
      pendingInvoices: pending.length,
      pendingRevenue: sum(pending),
      overdueInvoices: overdue.length,
      overdueRevenue: sum(overdue),
      from: from.toISOString(),
      to: to.toISOString(),
    });
  } catch (err: any) {
    console.error("GET /invoices/stats error", err);
    handleDbError(err, res);
  }
}


