// backend/src/routes/purchases.ts
import { Router, Request, Response } from "express";
import { query, queryOne, transaction } from "../database.js";
import { getOffset, createPageToken, handleDbError } from "../common.js";
import type { Purchase, PurchaseItem } from "../types.js";

const router = Router();

// Helper to convert database rows to Purchase with items
async function rowToPurchase(row: any): Promise<Purchase> {
  const items = await query<PurchaseItem>(
    "SELECT * FROM purchase_items WHERE purchase_id = $1 ORDER BY created_at",
    [row.id]
  );

  return {
    id: row.id,
    clientId: row.client_id,
    poNumber: row.po_number,
    date: row.date ? new Date(row.date).toISOString().split("T")[0] : new Date(row.created_at).toISOString().split("T")[0],
    status: row.status,
    items: items.map((item: any) => ({
      id: item.id,
      name: item.name,
      model: item.model || "",
      supplier: item.supplier || "",
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unit_price || 0),
      uom: item.uom || "",
      currency: item.currency || row.base_currency || "INR",
      total: Number(item.total || 0),
    })),
    subtotal: Number(row.subtotal || 0),
    tax: Number(row.tax || 0),
    total: Number(row.total || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    baseCurrency: row.base_currency || "INR",
    notes: row.notes || "",
  };
}

/**
 * GET /api/purchases
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      limit: limitRaw,
      pageToken,
      status,
      clientId,
      order = "desc",
      poPrefix,
    } = req.query as Record<string, string | undefined>;

    const limit = Math.min(Math.max(Number(limitRaw || 25), 1), 500);
    const offset = getOffset(pageToken);

    let sql = "SELECT * FROM purchases WHERE 1=1";
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      sql += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (clientId) {
      sql += ` AND client_id = $${paramCount}`;
      params.push(clientId);
      paramCount++;
    }

    if (poPrefix && poPrefix.trim()) {
      sql += ` AND po_number LIKE $${paramCount}`;
      params.push(`${poPrefix}%`);
      paramCount++;
    }

    sql += ` ORDER BY created_at ${order === "asc" ? "ASC" : "DESC"}`;
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    paramCount += 2;

    const purchases = await query(sql, params);

    // Fetch items for each purchase
    const purchasesWithItems = await Promise.all(
      purchases.map((p) => rowToPurchase(p))
    );

    // Check if there are more records
    let countSql = "SELECT COUNT(*) as count FROM purchases WHERE 1=1";
    const countParams: any[] = [];
    let countParamCount = 1;

    if (status) {
      countSql += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }
    if (clientId) {
      countSql += ` AND client_id = $${countParamCount}`;
      countParams.push(clientId);
      countParamCount++;
    }
    if (poPrefix && poPrefix.trim()) {
      countSql += ` AND po_number LIKE $${countParamCount}`;
      countParams.push(`${poPrefix}%`);
      countParamCount++;
    }

    const totalCount = await queryOne<{ count: string }>(countSql, countParams);
    const total = totalCount ? parseInt(totalCount.count) : 0;
    const hasMore = offset + limit < total;

    res.json({
      items: purchasesWithItems,
      nextPageToken: createPageToken(offset, limit, hasMore),
      nextCursor: purchases.length > 0 ? purchases[purchases.length - 1].created_at : undefined,
    });
  } catch (err: any) {
    console.error("GET /purchases error", err);
    handleDbError(err, res);
  }
});

/**
 * GET /api/purchases/byClient/:clientId
 */
router.get("/byClient/:clientId", async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const { limit: limitRaw, pageToken, order = "desc" } = req.query as Record<
      string,
      string | undefined
    >;

    const limit = Math.min(Math.max(Number(limitRaw || 50), 1), 500);
    const offset = getOffset(pageToken);

    const purchases = await query(
      `SELECT * FROM purchases 
       WHERE client_id = $1 
       ORDER BY created_at ${order === "asc" ? "ASC" : "DESC"}
       LIMIT $2 OFFSET $3`,
      [clientId, limit, offset]
    );

    const purchasesWithItems = await Promise.all(
      purchases.map((p) => rowToPurchase(p))
    );

    const totalCount = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM purchases WHERE client_id = $1",
      [clientId]
    );
    const total = totalCount ? parseInt(totalCount.count) : 0;
    const hasMore = offset + limit < total;

    res.json({
      items: purchasesWithItems,
      nextPageToken: createPageToken(offset, limit, hasMore),
      nextCursor: purchases.length > 0 ? purchases[purchases.length - 1].created_at : undefined,
    });
  } catch (err: any) {
    console.error("GET /purchases/byClient error", err);
    handleDbError(err, res);
  }
});

/**
 * POST /api/purchases/byIds
 */
router.post("/byIds", async (req: Request, res: Response) => {
  try {
    const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return res.json([]);

    const purchases = await query(
      `SELECT * FROM purchases WHERE id = ANY($1::uuid[])`,
      [ids]
    );

    const purchasesWithItems = await Promise.all(
      purchases.map((p) => rowToPurchase(p))
    );

    res.json(purchasesWithItems);
  } catch (err: any) {
    console.error("POST /purchases/byIds error", err);
    handleDbError(err, res);
  }
});

/**
 * GET /api/purchases/:id
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const purchase = await queryOne("SELECT * FROM purchases WHERE id = $1", [
      req.params.id,
    ]);
    if (!purchase) return res.status(404).json({ error: "Not found" });
    res.json(await rowToPurchase(purchase));
  } catch (err: any) {
    console.error("GET /purchases/:id error", err);
    handleDbError(err, res);
  }
});

/**
 * POST /api/purchases
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const input: Partial<Purchase> = req.body ?? {};

    const purchase = await transaction(async (client) => {
      // Insert purchase
      const purchaseResult = await client.query(
        `INSERT INTO purchases (client_id, po_number, date, status, subtotal, tax, total, base_currency, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          input.clientId || "",
          input.poNumber || "",
          input.date || new Date().toISOString().split("T")[0],
          input.status || "pending",
          input.subtotal || 0,
          input.tax || 0,
          input.total || 0,
          input.baseCurrency || "INR",
          input.notes || "",
        ]
      );

      const newPurchase = purchaseResult.rows[0];

      // Insert items
      if (Array.isArray(input.items) && input.items.length > 0) {
        for (const item of input.items) {
          await client.query(
            `INSERT INTO purchase_items 
             (purchase_id, name, model, supplier, quantity, unit_price, uom, currency, total)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              newPurchase.id,
              item.name,
              item.model || "",
              item.supplier || "",
              item.quantity || 0,
              item.unitPrice || 0,
              item.uom || "",
              item.currency || newPurchase.base_currency || "INR",
              item.total || (item.quantity || 0) * (item.unitPrice || 0),
            ]
          );
        }
      }

      return newPurchase;
    });

    res.status(201).json(await rowToPurchase(purchase));
  } catch (err: any) {
    console.error("POST /purchases error", err);
    handleDbError(err, res);
  }
});

/**
 * PATCH /api/purchases/:id
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const input: Partial<Purchase> = req.body ?? {};

    await transaction(async (client) => {
      // Update purchase
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (input.clientId !== undefined) {
        updates.push(`client_id = $${paramCount++}`);
        values.push(input.clientId);
      }
      if (input.poNumber !== undefined) {
        updates.push(`po_number = $${paramCount++}`);
        values.push(input.poNumber);
      }
      if (input.date !== undefined) {
        updates.push(`date = $${paramCount++}`);
        values.push(input.date);
      }
      if (input.status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(input.status);
      }
      if (input.subtotal !== undefined) {
        updates.push(`subtotal = $${paramCount++}`);
        values.push(input.subtotal);
      }
      if (input.tax !== undefined) {
        updates.push(`tax = $${paramCount++}`);
        values.push(input.tax);
      }
      if (input.total !== undefined) {
        updates.push(`total = $${paramCount++}`);
        values.push(input.total);
      }
      if (input.baseCurrency !== undefined) {
        updates.push(`base_currency = $${paramCount++}`);
        values.push(input.baseCurrency);
      }
      if (input.notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(input.notes);
      }

      if (updates.length > 0) {
        values.push(req.params.id);
        await client.query(
          `UPDATE purchases SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
          values
        );
      }

      // Update items if provided
      if (Array.isArray(input.items)) {
        // Delete existing items
        await client.query("DELETE FROM purchase_items WHERE purchase_id = $1", [
          req.params.id,
        ]);

        // Insert new items
        for (const item of input.items) {
          await client.query(
            `INSERT INTO purchase_items 
             (purchase_id, name, model, supplier, quantity, unit_price, uom, currency, total)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              req.params.id,
              item.name,
              item.model || "",
              item.supplier || "",
              item.quantity || 0,
              item.unitPrice || 0,
              item.uom || "",
              item.currency || input.baseCurrency || "INR",
              item.total || (item.quantity || 0) * (item.unitPrice || 0),
            ]
          );
        }
      }
    });

    const updated = await queryOne("SELECT * FROM purchases WHERE id = $1", [
      req.params.id,
    ]);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(await rowToPurchase(updated));
  } catch (err: any) {
    console.error("PATCH /purchases/:id error", err);
    handleDbError(err, res);
  }
});

/**
 * PUT /api/purchases/:id (same as PATCH)
 */
router.put("/:id", async (req: Request, res: Response) => {
  // Reuse PATCH handler
  return router.patch("/:id", req, res);
});

/**
 * DELETE /api/purchases/:id
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const exists = await queryOne("SELECT id FROM purchases WHERE id = $1", [
      req.params.id,
    ]);
    if (!exists) return res.status(404).json({ error: "Not found" });

    // Items will be deleted automatically due to CASCADE
    await query("DELETE FROM purchases WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /purchases/:id error", err);
    handleDbError(err, res);
  }
});

export default router;
