// backend/src/routes/finance/crud.ts
import { Request, Response } from "express";
import { query, queryOne } from "../../database.js";
import { handleDbError } from "../../common.js";

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

const FINANCE_STATUSES = new Set(["completed", "pending", "failed"]);
const FINANCE_TYPES = new Set(["invested", "expense", "tds"]);

function normalizeFinanceStatus(value: unknown): string {
  const normalized = String(value ?? "completed").trim().toLowerCase();
  return FINANCE_STATUSES.has(normalized) ? normalized : "completed";
}

function normalizeFinanceType(value: unknown): string {
  const normalized = String(value ?? "expense").trim().toLowerCase();
  return FINANCE_TYPES.has(normalized) ? normalized : "expense";
}

// Helper to convert database row to API format
function rowToFinanceRecord(row: any) {
  const amount = Number(row.amount || 0);
  const reimbursed =
    row.reimbursed_amount != null && row.reimbursed_amount !== ""
      ? Number(row.reimbursed_amount)
      : 0;
  return {
    id: row.id,
    type: row.type,
    category: row.category,
    amount,
    description: row.description || "",
    date: formatDateOnly(row.date) || formatDateOnly(row.created_at),
    paymentMethod: row.payment_method || "",
    status: row.status,
    reference: row.reference || undefined,
    taxYear: row.tax_year || undefined,
    amountSpentBy: row.amount_spent_by || undefined,
    reimbursedAmount:
      row.reimbursed_amount != null && row.reimbursed_amount !== ""
        ? Number(row.reimbursed_amount)
        : undefined,
    pendingAmount: amount - reimbursed,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

/**
 * POST /api/finance
 * Create a finance record
 */
export async function createFinanceRecord(req: Request, res: Response) {
  try {
    const body: any = req.body ?? {};
    const date = body.date || new Date().toISOString().split("T")[0];

    const reimbursed =
      body.reimbursedAmount !== undefined &&
      body.reimbursedAmount !== null &&
      body.reimbursedAmount !== ""
        ? Number(body.reimbursedAmount)
        : null;

    const result = await queryOne(
      `INSERT INTO finance_records (
        type, category, amount, description, date,
        payment_method, status, reference, tax_year,
        amount_spent_by, reimbursed_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        normalizeFinanceType(body.type),
        body.category,
        Number(body.amount || 0),
        body.description || "",
        date,
        body.paymentMethod || "",
        normalizeFinanceStatus(body.status),
        body.reference || null,
        body.taxYear || null,
        body.amountSpentBy != null && String(body.amountSpentBy).trim() !== ""
          ? String(body.amountSpentBy).trim()
          : null,
        reimbursed,
      ]
    );

    res.status(201).json(rowToFinanceRecord(result!));
  } catch (err: any) {
    console.error("POST /finance error", err);
    handleDbError(err, res);
  }
}

/**
 * PATCH /api/finance/:id
 * Update a finance record
 */
export async function updateFinanceRecord(req: Request, res: Response) {
  try {
    const exists = await queryOne("SELECT id FROM finance_records WHERE id = $1", [
      req.params.id,
    ]);
    if (!exists) return res.status(404).json({ error: "Not found" });

    const body: any = req.body ?? {};
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (body.type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(body.type);
    }
    if (body.category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(body.category);
    }
    if (body.amount !== undefined) {
      updates.push(`amount = $${paramCount++}`);
      values.push(Number(body.amount));
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(body.description);
    }
    if (body.date !== undefined) {
      updates.push(`date = $${paramCount++}`);
      values.push(body.date);
    }
    if (body.paymentMethod !== undefined) {
      updates.push(`payment_method = $${paramCount++}`);
      values.push(body.paymentMethod);
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(body.status);
    }
    if (body.reference !== undefined) {
      updates.push(`reference = $${paramCount++}`);
      values.push(body.reference || null);
    }
    if (body.taxYear !== undefined) {
      updates.push(`tax_year = $${paramCount++}`);
      values.push(body.taxYear || null);
    }
    if (body.amountSpentBy !== undefined) {
      updates.push(`amount_spent_by = $${paramCount++}`);
      const v = body.amountSpentBy;
      values.push(
        v != null && String(v).trim() !== "" ? String(v).trim() : null
      );
    }
    if (body.reimbursedAmount !== undefined) {
      updates.push(`reimbursed_amount = $${paramCount++}`);
      const r = body.reimbursedAmount;
      values.push(
        r === null || r === "" || (typeof r === "string" && r.trim() === "")
          ? null
          : Number(r)
      );
    }

    if (updates.length === 0) {
      const record = await queryOne("SELECT * FROM finance_records WHERE id = $1", [
        req.params.id,
      ]);
      return res.json(rowToFinanceRecord(record!));
    }

    values.push(req.params.id);
    const sql = `UPDATE finance_records SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

    const result = await queryOne(sql, values);
    res.json(rowToFinanceRecord(result!));
  } catch (err: any) {
    console.error("PATCH /finance/:id error", err);
    handleDbError(err, res);
  }
}

/**
 * DELETE /api/finance/:id
 * Delete a finance record
 */
export async function deleteFinanceRecord(req: Request, res: Response) {
  try {
    const exists = await queryOne("SELECT id FROM finance_records WHERE id = $1", [
      req.params.id,
    ]);
    if (!exists) return res.status(404).json({ error: "Not found" });

    await query("DELETE FROM finance_records WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /finance/:id error", err);
    handleDbError(err, res);
  }
}

