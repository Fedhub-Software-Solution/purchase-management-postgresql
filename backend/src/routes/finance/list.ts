// backend/src/routes/finance/list.ts
import { Request, Response } from "express";
import { query, queryOne } from "../../database.js";
import { getOffset, createPageToken, handleDbError } from "../../common.js";

function formatDateOnly(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") {
    const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return undefined;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
      value.getDate()
    ).padStart(2, "0")}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

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
          (r.reference || "").toLowerCase().includes(s) ||
          (r.amount_spent_by || "").toLowerCase().includes(s)
      );
    }

    // Convert to API format
    const items = filteredRecords.map((row: any) => ({
      id: row.id,
      type: row.type,
      category: row.category,
      amount: Number(row.amount || 0),
      description: row.description || "",
      date: formatDateOnly(row.date) || formatDateOnly(row.created_at),
      paymentMethod: row.payment_method || "",
      status: row.status,
      amountSpentBy: row.amount_spent_by || undefined,
      reimbursedAmount:
        row.reimbursed_amount != null && row.reimbursed_amount !== ""
          ? Number(row.reimbursed_amount)
          : undefined,
      pendingAmount:
        Number(row.amount || 0) -
        (row.reimbursed_amount != null && row.reimbursed_amount !== ""
          ? Number(row.reimbursed_amount)
          : 0),
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

