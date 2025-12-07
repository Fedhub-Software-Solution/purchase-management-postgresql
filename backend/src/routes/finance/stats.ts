// backend/src/routes/finance/stats.ts
import { Request, Response } from "express";
import { query } from "../../database.js";
import { handleDbError } from "../../common.js";

/**
 * GET /api/finance/stats
 * Returns finance statistics
 */
export async function getFinanceStats(req: Request, res: Response) {
  try {
    const { search, type, category, status, paymentMethod } = req.query as Record<
      string,
      string | undefined
    >;

    let sql = "SELECT * FROM finance_records WHERE 1=1";
    const params: any[] = [];
    let paramCount = 1;

    if (type) {
      sql += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    if (category) {
      sql += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    if (status) {
      sql += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    if (paymentMethod) {
      sql += ` AND payment_method = $${paramCount}`;
      params.push(paymentMethod);
      paramCount++;
    }

    sql += ` ORDER BY created_at DESC`;

    const records = await query(sql, params);

    // Apply search filter if provided
    let filteredRecords = records;
    if (search) {
      const s = search.toLowerCase();
      filteredRecords = records.filter(
        (r: any) =>
          (r.description || "").toLowerCase().includes(s) ||
          (r.category || "").toLowerCase().includes(s) ||
          (r.payment_method || "").toLowerCase().includes(s) ||
          (r.reference || "").toLowerCase().includes(s)
      );
    }

    const sum = (arr: any[]) => arr.reduce((s, x) => s + (Number(x.amount) || 0), 0);

    const invested = filteredRecords.filter(
      (x: any) => x.type === "invested" && x.status === "completed"
    );
    const expenses = filteredRecords.filter(
      (x: any) => x.type === "expense" && x.status === "completed"
    );
    const tds = filteredRecords.filter(
      (x: any) => x.type === "tds" && x.status === "completed"
    );

    const totalInvested = sum(invested);
    const totalExpenses = sum(expenses);
    const totalTDS = sum(tds);

    res.json({
      totalInvested,
      totalExpenses,
      totalTDS,
      profit: totalInvested - totalExpenses - totalTDS,
    });
  } catch (err: any) {
    console.error("GET /finance/stats error", err);
    handleDbError(err, res);
  }
}

