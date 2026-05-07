import { Router, Request, Response } from "express";
import { z } from "zod";
import { query, queryOne } from "../database.js";
import {
  sendZodError,
  getOffset,
  createPageToken,
  handleDbError,
} from "../common.js";
import type { Supplier } from "../types.js";

export const suppliersRouter = Router();

const supplierSchema = z.object({
  name: z.string().min(1),
  supplierCode: z.string().optional().default(""),
  panNumber: z.string().optional().default(""),
  contactPerson: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")).default(""),
  phone: z.string().optional().default(""),
  gstin: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  pincode: z.string().optional().default(""),
  categories: z.array(z.string()).optional().default([]),
  status: z.enum(["active", "inactive"]).default("active"),
  bankInfo: z
    .object({
      accountName: z.string().optional().default(""),
      bankName: z.string().optional().default(""),
      accountNumber: z.string().optional().default(""),
      ifscCode: z.string().optional().default(""),
      branch: z.string().optional().default(""),
      upiId: z.string().optional().default(""),
    })
    .optional()
    .default({}),
  notes: z.string().optional().default(""),
});

function rowToSupplier(row: any): Supplier {
  return {
    id: row.id,
    name: row.name,
    supplierCode: row.supplier_code || "",
    panNumber: row.pan_number || "",
    contactPerson: row.contact_person || "",
    email: row.email || "",
    phone: row.phone || "",
    gstin: row.gstin || "",
    address: row.address || "",
    city: row.city || "",
    state: row.state || "",
    pincode: row.pincode || "",
    categories: Array.isArray(row.categories) ? row.categories : [],
    status: row.status,
    bankInfo: row.bank_info || {},
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

// GET /api/suppliers
suppliersRouter.get("/", async (req: Request, res: Response) => {
  try {
    const rawLimit = Number(req.query.limit ?? 2000);
    const limit = Math.max(1, Math.min(5000, Number.isFinite(rawLimit) ? rawLimit : 2000));
    const pageToken = req.query.pageToken ? String(req.query.pageToken) : undefined;
    const offset = getOffset(pageToken);
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim();

    const where: string[] = ["1=1"];
    const params: any[] = [];
    let p = 1;

    if (q) {
      where.push(`(name ILIKE $${p} OR contact_person ILIKE $${p} OR email ILIKE $${p})`);
      params.push(`%${q}%`);
      p++;
    }
    if (status === "active" || status === "inactive") {
      where.push(`status = $${p}`);
      params.push(status);
      p++;
    }

    const whereSql = where.join(" AND ");
    const rows = await query(
      `SELECT * FROM suppliers WHERE ${whereSql} ORDER BY created_at DESC LIMIT $${p} OFFSET $${p + 1}`,
      [...params, limit, offset]
    );

    const totalCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM suppliers WHERE ${whereSql}`,
      params
    );
    const total = totalCount ? parseInt(totalCount.count) : 0;
    const hasMore = offset + limit < total;

    res.json({
      items: rows.map(rowToSupplier),
      nextPageToken: createPageToken(offset, limit, hasMore),
      total,
    });
  } catch (err: any) {
    console.error("GET /suppliers error", err);
    handleDbError(err, res);
  }
});

// GET /api/suppliers/:id
suppliersRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const supplier = await queryOne("SELECT * FROM suppliers WHERE id = $1", [req.params.id]);
    if (!supplier) return res.status(404).json({ error: "Not found" });
    res.json(rowToSupplier(supplier));
  } catch (err: any) {
    console.error("GET /suppliers/:id error", err);
    handleDbError(err, res);
  }
});

// POST /api/suppliers
suppliersRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = supplierSchema.parse(req.body);
    const created = await queryOne(
      `INSERT INTO suppliers (name, supplier_code, pan_number, contact_person, email, phone, gstin, address, city, state, pincode, categories, status, bank_info, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14::jsonb, $15)
       RETURNING *`,
      [
        parsed.name.trim(),
        parsed.supplierCode.trim(),
        parsed.panNumber.trim(),
        parsed.contactPerson.trim(),
        parsed.email.trim(),
        parsed.phone.trim(),
        parsed.gstin.trim(),
        parsed.address.trim(),
        parsed.city.trim(),
        parsed.state.trim(),
        parsed.pincode.trim(),
        JSON.stringify(parsed.categories || []),
        parsed.status,
        JSON.stringify(parsed.bankInfo || {}),
        parsed.notes,
      ]
    );
    res.status(201).json(rowToSupplier(created));
  } catch (e: any) {
    if (e?.issues) return sendZodError(res, e);
    console.error("POST /suppliers error", e);
    handleDbError(e, res);
  }
});

// PUT /api/suppliers/:id
suppliersRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const parsed = supplierSchema.partial().parse(req.body);
    const updates: string[] = [];
    const values: any[] = [];
    let p = 1;

    if (parsed.name !== undefined) {
      updates.push(`name = $${p++}`);
      values.push(parsed.name.trim());
    }
    if (parsed.supplierCode !== undefined) {
      updates.push(`supplier_code = $${p++}`);
      values.push(parsed.supplierCode.trim());
    }
    if (parsed.panNumber !== undefined) {
      updates.push(`pan_number = $${p++}`);
      values.push(parsed.panNumber.trim());
    }
    if (parsed.contactPerson !== undefined) {
      updates.push(`contact_person = $${p++}`);
      values.push(parsed.contactPerson.trim());
    }
    if (parsed.email !== undefined) {
      updates.push(`email = $${p++}`);
      values.push(parsed.email.trim());
    }
    if (parsed.phone !== undefined) {
      updates.push(`phone = $${p++}`);
      values.push(parsed.phone.trim());
    }
    if (parsed.gstin !== undefined) {
      updates.push(`gstin = $${p++}`);
      values.push(parsed.gstin.trim());
    }
    if (parsed.address !== undefined) {
      updates.push(`address = $${p++}`);
      values.push(parsed.address.trim());
    }
    if (parsed.city !== undefined) {
      updates.push(`city = $${p++}`);
      values.push(parsed.city.trim());
    }
    if (parsed.state !== undefined) {
      updates.push(`state = $${p++}`);
      values.push(parsed.state.trim());
    }
    if (parsed.pincode !== undefined) {
      updates.push(`pincode = $${p++}`);
      values.push(parsed.pincode.trim());
    }
    if (parsed.categories !== undefined) {
      updates.push(`categories = $${p++}::jsonb`);
      values.push(JSON.stringify(parsed.categories || []));
    }
    if (parsed.status !== undefined) {
      updates.push(`status = $${p++}`);
      values.push(parsed.status);
    }
    if (parsed.bankInfo !== undefined) {
      updates.push(`bank_info = $${p++}::jsonb`);
      values.push(JSON.stringify(parsed.bankInfo || {}));
    }
    if (parsed.notes !== undefined) {
      updates.push(`notes = $${p++}`);
      values.push(parsed.notes);
    }

    if (updates.length === 0) {
      const existing = await queryOne("SELECT * FROM suppliers WHERE id = $1", [req.params.id]);
      if (!existing) return res.status(404).json({ error: "Not found" });
      return res.json(rowToSupplier(existing));
    }

    values.push(req.params.id);
    const updated = await queryOne(
      `UPDATE suppliers
       SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${p}
       RETURNING *`,
      values
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(rowToSupplier(updated));
  } catch (e: any) {
    if (e?.issues) return sendZodError(res, e);
    console.error("PUT /suppliers/:id error", e);
    handleDbError(e, res);
  }
});

// DELETE /api/suppliers/:id
suppliersRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await queryOne("SELECT id FROM suppliers WHERE id = $1", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Not found" });
    await query("DELETE FROM suppliers WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err: any) {
    console.error("DELETE /suppliers/:id error", err);
    handleDbError(err, res);
  }
});
