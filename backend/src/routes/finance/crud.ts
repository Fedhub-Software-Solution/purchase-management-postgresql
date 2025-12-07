// backend/src/routes/finance/crud.ts
import { Request, Response } from "express";
import { query, queryOne } from "../../database.js";
import { handleDbError } from "../../common.js";

// Helper to convert database row to API format
function rowToFinanceRecord(row: any) {
  return {
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

    const result = await queryOne(
      `INSERT INTO finance_records (
        type, category, amount, description, date,
        payment_method, status, reference, tax_year
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        body.type,
        body.category,
        Number(body.amount || 0),
        body.description || "",
        date,
        body.paymentMethod || "",
        body.status || "completed",
        body.reference || null,
        body.taxYear || null,
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

