// backend/src/routes/invoices.ts
import { Router } from "express";
import { listInvoices } from "./invoices/list.js";
import { getInvoiceStats } from "./invoices/stats.js";
import {
  getInvoice,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
} from "./invoices/crud.js";

const router = Router();

// Stats route must come before /:id
router.get("/stats", getInvoiceStats);

// List invoices
router.get("/", listInvoices);

// Get single invoice
router.get("/:id", getInvoice);

// Create invoice
router.post("/", createInvoice);

// Update invoice (partial)
router.patch("/:id", updateInvoice);

// Update invoice (full)
router.put("/:id", updateInvoice);

// Update invoice status only
router.patch("/:id/status", updateInvoiceStatus);

// Delete invoice
router.delete("/:id", deleteInvoice);

export default router;
