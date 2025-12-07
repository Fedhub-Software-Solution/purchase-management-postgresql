// backend/src/routes/invoices/crud.ts
import { Request, Response } from "express";
import { query, queryOne, transaction } from "../../database.js";
import { handleDbError } from "../../common.js";
import { rowToInvoice, nextInvoiceNumber } from "./helpers.js";

/**
 * GET /api/invoices/:id
 */
export async function getInvoice(req: Request, res: Response) {
  try {
    const invoice = await queryOne("SELECT * FROM invoices WHERE id = $1", [
      req.params.id,
    ]);
    if (!invoice) return res.status(404).json({ error: "Not found" });
    res.json(await rowToInvoice(invoice));
  } catch (err: any) {
    console.error("GET /invoices/:id error", err);
    handleDbError(err, res);
  }
}

/**
 * POST /api/invoices
 */
export async function createInvoice(req: Request, res: Response) {
  try {
    const payload: any = req.body ?? {};

    const invoice = await transaction(async (client) => {
      // Generate invoice number if missing
      const invoiceNumber: string =
        typeof payload.invoiceNumber === "string" && payload.invoiceNumber.trim()
          ? payload.invoiceNumber.trim()
          : await nextInvoiceNumber();

      // Parse dates
      const date = payload.date || new Date().toISOString().split("T")[0];
      const dueDate = payload.dueDate || date;

      // Insert invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          client_id, invoice_number, date, due_date, status,
          subtotal, tax, total, payment_terms, notes, base_currency
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          payload.clientId || "",
          invoiceNumber,
          date,
          dueDate,
          payload.status || "draft",
          payload.subtotal || 0,
          payload.tax || 0,
          payload.total || 0,
          payload.paymentTerms || "30",
          payload.notes || "",
          payload.baseCurrency || "INR",
        ]
      );

      const newInvoice = invoiceResult.rows[0];

      // Insert items
      if (Array.isArray(payload.items) && payload.items.length > 0) {
        for (const item of payload.items) {
          await client.query(
            `INSERT INTO invoice_items (
              invoice_id, purchase_id, po_number, name, model, supplier,
              quantity, unit_price, uom, currency, total
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              newInvoice.id,
              item.purchaseId || null,
              item.poNumber || "",
              item.name,
              item.model || "",
              item.supplier || "",
              item.quantity || 0,
              item.unitPrice || 0,
              item.uom || "",
              item.currency || newInvoice.base_currency || "INR",
              item.total || (item.quantity || 0) * (item.unitPrice || 0),
            ]
          );
        }
      }

      // Insert invoice-purchase relations
      const purchaseIds = payload.purchaseIds || (payload.purchaseId ? [payload.purchaseId] : []);
      if (purchaseIds.length > 0) {
        for (const purchaseId of purchaseIds) {
          await client.query(
            `INSERT INTO invoice_purchases (invoice_id, purchase_id) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [newInvoice.id, purchaseId]
          );
        }
      }

      return newInvoice;
    });

    res.status(201).json(await rowToInvoice(invoice));
  } catch (err: any) {
    console.error("POST /invoices error", err);
    handleDbError(err, res);
  }
}

/**
 * PATCH /api/invoices/:id
 */
export async function updateInvoice(req: Request, res: Response) {
  try {
    const payload: any = req.body ?? {};

    await transaction(async (client) => {
      // Update invoice
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (payload.clientId !== undefined) {
        updates.push(`client_id = $${paramCount++}`);
        values.push(payload.clientId);
      }
      if (payload.invoiceNumber !== undefined) {
        updates.push(`invoice_number = $${paramCount++}`);
        values.push(payload.invoiceNumber);
      }
      if (payload.date !== undefined) {
        updates.push(`date = $${paramCount++}`);
        values.push(payload.date);
      }
      if (payload.dueDate !== undefined) {
        updates.push(`due_date = $${paramCount++}`);
        values.push(payload.dueDate);
      }
      if (payload.status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(payload.status);
        if (payload.status === "paid" && !payload.paidAt) {
          updates.push(`paid_at = CURRENT_TIMESTAMP`);
        }
      }
      if (payload.subtotal !== undefined) {
        updates.push(`subtotal = $${paramCount++}`);
        values.push(payload.subtotal);
      }
      if (payload.tax !== undefined) {
        updates.push(`tax = $${paramCount++}`);
        values.push(payload.tax);
      }
      if (payload.total !== undefined) {
        updates.push(`total = $${paramCount++}`);
        values.push(payload.total);
      }
      if (payload.paymentTerms !== undefined) {
        updates.push(`payment_terms = $${paramCount++}`);
        values.push(payload.paymentTerms);
      }
      if (payload.notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(payload.notes);
      }
      if (payload.baseCurrency !== undefined) {
        updates.push(`base_currency = $${paramCount++}`);
        values.push(payload.baseCurrency);
      }

      if (updates.length > 0) {
        values.push(req.params.id);
        await client.query(
          `UPDATE invoices SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
          values
        );
      }

      // Update items if provided
      if (Array.isArray(payload.items)) {
        // Delete existing items
        await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [
          req.params.id,
        ]);

        // Insert new items
        for (const item of payload.items) {
          await client.query(
            `INSERT INTO invoice_items (
              invoice_id, purchase_id, po_number, name, model, supplier,
              quantity, unit_price, uom, currency, total
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              req.params.id,
              item.purchaseId || null,
              item.poNumber || "",
              item.name,
              item.model || "",
              item.supplier || "",
              item.quantity || 0,
              item.unitPrice || 0,
              item.uom || "",
              item.currency || payload.baseCurrency || "INR",
              item.total || (item.quantity || 0) * (item.unitPrice || 0),
            ]
          );
        }
      }

      // Update invoice-purchase relations if provided
      if (payload.purchaseIds) {
        // Delete existing relations
        await client.query("DELETE FROM invoice_purchases WHERE invoice_id = $1", [
          req.params.id,
        ]);

        // Insert new relations
        for (const purchaseId of payload.purchaseIds) {
          await client.query(
            `INSERT INTO invoice_purchases (invoice_id, purchase_id) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [req.params.id, purchaseId]
          );
        }
      }
    });

    const updated = await queryOne("SELECT * FROM invoices WHERE id = $1", [
      req.params.id,
    ]);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(await rowToInvoice(updated));
  } catch (err: any) {
    console.error("PATCH /invoices/:id error", err);
    handleDbError(err, res);
  }
}

/**
 * PATCH /api/invoices/:id/status
 */
export async function updateInvoiceStatus(req: Request, res: Response) {
  try {
    const { status } = req.body as { status: string };
    const exists = await queryOne("SELECT id FROM invoices WHERE id = $1", [
      req.params.id,
    ]);
    if (!exists) return res.status(404).json({ error: "Not found" });

    const updates: string[] = [`status = $1`, `updated_at = CURRENT_TIMESTAMP`];
    const values: any[] = [status];

    if (status === "paid") {
      updates.push(`paid_at = CURRENT_TIMESTAMP`);
    }

    await query(
      `UPDATE invoices SET ${updates.join(", ")} WHERE id = $${values.length + 1}`,
      [...values, req.params.id]
    );

    const updated = await queryOne("SELECT * FROM invoices WHERE id = $1", [
      req.params.id,
    ]);
    res.json(await rowToInvoice(updated!));
  } catch (err: any) {
    console.error("PATCH /invoices/:id/status error", err);
    handleDbError(err, res);
  }
}

/**
 * DELETE /api/invoices/:id
 */
export async function deleteInvoice(req: Request, res: Response) {
  try {
    const exists = await queryOne("SELECT id FROM invoices WHERE id = $1", [
      req.params.id,
    ]);
    if (!exists) return res.status(404).json({ error: "Not found" });

    // Items and relations will be deleted automatically due to CASCADE
    await query("DELETE FROM invoices WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /invoices/:id error", err);
    handleDbError(err, res);
  }
}


