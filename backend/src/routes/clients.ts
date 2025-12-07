// backend/src/routes/clients.ts
import { Router, Request, Response } from "express";
import { query, queryOne } from "../database.js";
import { z } from "zod";
import { parseListParams, sendZodError, getOffset, createPageToken, handleDbError } from "../common.js";
import type { Client } from "../types.js";

export const clientsRouter = Router();

const clientSchema = z.object({
  company: z.string().min(1),
  contactPerson: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(3),
  status: z.enum(["active", "inactive"]),
  gstNumber: z.string().optional().default(""),
  msmeNumber: z.string().optional().default(""),
  panNumber: z.string().optional().default(""),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  notes: z.string().optional().default(""),
  baseCurrency: z.string().min(1),
});

// Helper to convert database row to Client type
function rowToClient(row: any): Client {
  return {
    id: row.id,
    company: row.company,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    status: row.status,
    gstNumber: row.gst_number || "",
    msmeNumber: row.msme_number || "",
    panNumber: row.pan_number || "",
    billingAddress: {
      street: row.billing_address_street,
      city: row.billing_address_city,
      state: row.billing_address_state,
      postalCode: row.billing_address_postal_code,
      country: row.billing_address_country,
    },
    shippingAddress: {
      street: row.shipping_address_street,
      city: row.shipping_address_city,
      state: row.shipping_address_state,
      postalCode: row.shipping_address_postal_code,
      country: row.shipping_address_country,
    },
    notes: row.notes || "",
    baseCurrency: row.base_currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

// GET /api/clients
clientsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { limit, pageToken } = parseListParams(req);
    const offset = getOffset(pageToken);

    const clients = await query(
      `SELECT * FROM clients 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Check if there are more records
    const totalCount = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM clients"
    );
    const total = totalCount ? parseInt(totalCount.count) : 0;
    const hasMore = offset + limit < total;

    const nextPageToken = createPageToken(offset, limit, hasMore);

    res.json({
      items: clients.map(rowToClient),
      nextPageToken,
    });
  } catch (err: any) {
    console.error("GET /clients error", err);
    handleDbError(err, res);
  }
});

// GET /api/clients/:id
clientsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const client = await queryOne("SELECT * FROM clients WHERE id = $1", [
      req.params.id,
    ]);
    if (!client) return res.status(404).json({ error: "Not found" });
    res.json(rowToClient(client));
  } catch (err: any) {
    console.error("GET /clients/:id error", err);
    handleDbError(err, res);
  }
});

// POST /api/clients
clientsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = clientSchema.parse(req.body);
    const result = await queryOne(
      `INSERT INTO clients (
        company, contact_person, email, phone, status,
        gst_number, msme_number, pan_number,
        billing_address_street, billing_address_city, billing_address_state,
        billing_address_postal_code, billing_address_country,
        shipping_address_street, shipping_address_city, shipping_address_state,
        shipping_address_postal_code, shipping_address_country,
        notes, base_currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        parsed.company,
        parsed.contactPerson,
        parsed.email,
        parsed.phone,
        parsed.status,
        parsed.gstNumber,
        parsed.msmeNumber,
        parsed.panNumber,
        parsed.billingAddress.street,
        parsed.billingAddress.city,
        parsed.billingAddress.state,
        parsed.billingAddress.postalCode,
        parsed.billingAddress.country,
        parsed.shippingAddress.street,
        parsed.shippingAddress.city,
        parsed.shippingAddress.state,
        parsed.shippingAddress.postalCode,
        parsed.shippingAddress.country,
        parsed.notes,
        parsed.baseCurrency,
      ]
    );
    res.status(201).json(rowToClient(result!));
  } catch (e: any) {
    if (e?.issues) return sendZodError(res, e);
    console.error("POST /clients error", e);
    handleDbError(e, res);
  }
});

// PUT /api/clients/:id
clientsRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const parsed = clientSchema.partial().parse(req.body);

    // Build dynamic UPDATE query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (parsed.company !== undefined) {
      updates.push(`company = $${paramCount++}`);
      values.push(parsed.company);
    }
    if (parsed.contactPerson !== undefined) {
      updates.push(`contact_person = $${paramCount++}`);
      values.push(parsed.contactPerson);
    }
    if (parsed.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(parsed.email);
    }
    if (parsed.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(parsed.phone);
    }
    if (parsed.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(parsed.status);
    }
    if (parsed.gstNumber !== undefined) {
      updates.push(`gst_number = $${paramCount++}`);
      values.push(parsed.gstNumber);
    }
    if (parsed.msmeNumber !== undefined) {
      updates.push(`msme_number = $${paramCount++}`);
      values.push(parsed.msmeNumber);
    }
    if (parsed.panNumber !== undefined) {
      updates.push(`pan_number = $${paramCount++}`);
      values.push(parsed.panNumber);
    }
    if (parsed.billingAddress) {
      updates.push(`billing_address_street = $${paramCount++}`);
      values.push(parsed.billingAddress.street);
      updates.push(`billing_address_city = $${paramCount++}`);
      values.push(parsed.billingAddress.city);
      updates.push(`billing_address_state = $${paramCount++}`);
      values.push(parsed.billingAddress.state);
      updates.push(`billing_address_postal_code = $${paramCount++}`);
      values.push(parsed.billingAddress.postalCode);
      updates.push(`billing_address_country = $${paramCount++}`);
      values.push(parsed.billingAddress.country);
    }
    if (parsed.shippingAddress) {
      updates.push(`shipping_address_street = $${paramCount++}`);
      values.push(parsed.shippingAddress.street);
      updates.push(`shipping_address_city = $${paramCount++}`);
      values.push(parsed.shippingAddress.city);
      updates.push(`shipping_address_state = $${paramCount++}`);
      values.push(parsed.shippingAddress.state);
      updates.push(`shipping_address_postal_code = $${paramCount++}`);
      values.push(parsed.shippingAddress.postalCode);
      updates.push(`shipping_address_country = $${paramCount++}`);
      values.push(parsed.shippingAddress.country);
    }
    if (parsed.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(parsed.notes);
    }
    if (parsed.baseCurrency !== undefined) {
      updates.push(`base_currency = $${paramCount++}`);
      values.push(parsed.baseCurrency);
    }

    if (updates.length === 0) {
      const client = await queryOne("SELECT * FROM clients WHERE id = $1", [
        req.params.id,
      ]);
      if (!client) return res.status(404).json({ error: "Not found" });
      return res.json(rowToClient(client));
    }

    values.push(req.params.id);
    const sql = `UPDATE clients SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

    const result = await queryOne(sql, values);
    if (!result) return res.status(404).json({ error: "Not found" });
    res.json(rowToClient(result));
  } catch (e: any) {
    if (e?.issues) return sendZodError(res, e);
    console.error("PUT /clients/:id error", e);
    handleDbError(e, res);
  }
});

// DELETE /api/clients/:id
clientsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await queryOne("SELECT id FROM clients WHERE id = $1", [
      req.params.id,
    ]);
    if (!result) return res.status(404).json({ error: "Not found" });

    await query("DELETE FROM clients WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err: any) {
    console.error("DELETE /clients/:id error", err);
    handleDbError(err, res);
  }
});
