// backend/src/routes/finance.ts
import { Router } from "express";
import { listFinanceRecords } from "./finance/list.js";
import { getFinanceStats } from "./finance/stats.js";
import {
  createFinanceRecord,
  updateFinanceRecord,
  deleteFinanceRecord,
} from "./finance/crud.js";

const router = Router();

// Stats route must come before /:id
router.get("/stats", getFinanceStats);

// List finance records
router.get("/", listFinanceRecords);

// Create finance record
router.post("/", createFinanceRecord);

// Update finance record
router.patch("/:id", updateFinanceRecord);

// Delete finance record
router.delete("/:id", deleteFinanceRecord);

export default router;
