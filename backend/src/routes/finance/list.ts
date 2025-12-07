// backend/src/routes/finance/list.ts
import { Request, Response } from "express";
import { query, queryOne } from "../../database.js";
import { getOffset, createPageToken, handleDbError } from "../../common.js";

/**
 * GET /api/finance
 * List finance records with filtering and search
 */
export async function listFinanceRecords(req: Request, res: Response) {
  try {
    const {
      search,
      type,
      category,
      status,
      paymentMethod,
      order = "desc",
      limit: limitRaw,
      pageToken,
    } = req.query as Record<string, string | undefined>;

    const limit = Math.min(Math.max(Number(limitRaw || 100), 1), 500);
    const offset = getOffset(pageToken);

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

    sql += ` ORDER BY created_at ${order === "asc" ? "ASC" : "DESC"}`;
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const records = await query(sql, params);

    // Apply search filter if provided (client-side filtering)
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

    // Convert to API format
    const items = filteredRecords.map((row: any) => ({
      id: row.id,
      type: row.type,
      category: row.category,
      amount: Number(row.amount || 0),
      description: row.description || "",
      date: row.date ? new Date(row.date).toISOString().split("T")[0] : new Date(row.created_at).toISOString().split("T")[0],
      paymentMethod: row.payment_method || "",
      status: row.status,
      reference: row.reference || undefined,
      taxYear: row.tax_year || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }));

    // Check if there are more records
    let countSql = "SELECT COUNT(*) as count FROM finance_records WHERE 1=1";
    const countParams: any[] = [];
    let countParamCount = 1;

    if (type) {
      countSql += ` AND type = $${countParamCount}`;
      countParams.push(type);
      countParamCount++;
    }
    if (category) {
      countSql += ` AND category = $${countParamCount}`;
      countParams.push(category);
      countParamCount++;
    }
    if (status) {
      countSql += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }
    if (paymentMethod) {
      countSql += ` AND payment_method = $${countParamCount}`;
      countParams.push(paymentMethod);
      countParamCount++;
    }

    const totalCount = await queryOne<{ count: string }>(countSql, countParams);
    const total = totalCount ? parseInt(totalCount.count) : 0;
    const hasMore = offset + limit < total;

    res.json({
      items,
      nextPageToken: createPageToken(offset, limit, hasMore),
      total: items.length,
    });
  } catch (err: any) {
    console.error("GET /finance error", err);
    handleDbError(err, res);
  }
}

