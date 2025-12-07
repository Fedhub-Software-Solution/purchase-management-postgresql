// backend/src/routes/settings.ts
import { Router, Request, Response } from "express";
import { query, queryOne } from "../database.js";

const router = Router();

const SETTINGS_KEY = "current";

type Theme = "light" | "dark";

export type AppSettings = {
  // Appearance
  theme: Theme;
  sidebarCollapsed: boolean;

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  invoiceReminders: boolean;

  // Company Info
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyGST: string;
  companyPAN: string;
  companyMSME: string;

  // Invoice Settings
  defaultTaxRate: number; // %
  defaultPaymentTerms: number; // days
  invoicePrefix: string;

  // Security (optional)
  twoFactorAuth?: boolean;
  sessionTimeout?: number; // minutes

  // Meta
  createdAt?: string;
  updatedAt?: string;
};

const DEFAULTS: AppSettings = {
  theme: "light",
  sidebarCollapsed: false,

  emailNotifications: true,
  pushNotifications: false,
  invoiceReminders: true,

  companyName: "FedHub Software Solutions",
  companyEmail: "info@fedhubsoftware.com",
  companyPhone: "+91 9003285428",
  companyAddress:
    "P No 69,70 Gokula Nandhana, Gokul Nagar, Hosur, Krishnagiri-DT, Tamilnadu, India-635109",
  companyGST: "33AACCF2123P1Z5",
  companyPAN: "AACCF2123P",
  companyMSME: "UDYAM-TN-06-0012345",

  defaultTaxRate: 18,
  defaultPaymentTerms: 30,
  invoicePrefix: "INV",

  twoFactorAuth: false,
  sessionTimeout: 60,
};

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */
function normalizeSettings(row: any): AppSettings {
  const value = row?.value || {};
  return {
    id: row?.id,
    theme: value.theme === "dark" ? "dark" : "light",
    sidebarCollapsed: !!value.sidebarCollapsed,

    emailNotifications: !!value.emailNotifications,
    pushNotifications: !!value.pushNotifications,
    invoiceReminders: !!value.invoiceReminders,

    companyName: value.companyName ?? DEFAULTS.companyName,
    companyEmail: value.companyEmail ?? DEFAULTS.companyEmail,
    companyPhone: value.companyPhone ?? DEFAULTS.companyPhone,
    companyAddress: value.companyAddress ?? DEFAULTS.companyAddress,
    companyGST: value.companyGST ?? DEFAULTS.companyGST,
    companyPAN: value.companyPAN ?? DEFAULTS.companyPAN,
    companyMSME: value.companyMSME ?? DEFAULTS.companyMSME,

    defaultTaxRate: Number(value.defaultTaxRate ?? DEFAULTS.defaultTaxRate),
    defaultPaymentTerms: Number(value.defaultPaymentTerms ?? DEFAULTS.defaultPaymentTerms),
    invoicePrefix: value.invoicePrefix ?? DEFAULTS.invoicePrefix,

    twoFactorAuth: !!value.twoFactorAuth,
    sessionTimeout: Number(value.sessionTimeout ?? DEFAULTS.sessionTimeout),

    createdAt: row?.created_at,
    updatedAt: row?.updated_at || row?.created_at,
  };
}

function sanitizePatch(body: Partial<AppSettings>): Partial<AppSettings> {
  const out: Partial<AppSettings> = {};

  if (body.theme) out.theme = body.theme === "dark" ? "dark" : "light";
  if (typeof body.sidebarCollapsed === "boolean")
    out.sidebarCollapsed = body.sidebarCollapsed;

  if (typeof body.emailNotifications === "boolean")
    out.emailNotifications = body.emailNotifications;
  if (typeof body.pushNotifications === "boolean")
    out.pushNotifications = body.pushNotifications;
  if (typeof body.invoiceReminders === "boolean")
    out.invoiceReminders = body.invoiceReminders;

  if (typeof body.companyName === "string") out.companyName = body.companyName;
  if (typeof body.companyEmail === "string") out.companyEmail = body.companyEmail;
  if (typeof body.companyPhone === "string") out.companyPhone = body.companyPhone;
  if (typeof body.companyAddress === "string")
    out.companyAddress = body.companyAddress;
  if (typeof body.companyGST === "string")
    out.companyGST = body.companyGST.toUpperCase();
  if (typeof body.companyPAN === "string")
    out.companyPAN = body.companyPAN.toUpperCase();
  if (typeof body.companyMSME === "string")
    out.companyMSME = body.companyMSME.toUpperCase();

  if (body.defaultTaxRate !== undefined) {
    const v = Number(body.defaultTaxRate);
    out.defaultTaxRate = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 18;
  }
  if (body.defaultPaymentTerms !== undefined) {
    const v = Number(body.defaultPaymentTerms);
    out.defaultPaymentTerms = Number.isFinite(v) ? Math.max(1, Math.floor(v)) : 30;
  }
  if (typeof body.invoicePrefix === "string") out.invoicePrefix = body.invoicePrefix;

  if (typeof body.twoFactorAuth === "boolean") out.twoFactorAuth = body.twoFactorAuth;
  if (body.sessionTimeout !== undefined) {
    const v = Number(body.sessionTimeout);
    out.sessionTimeout = Number.isFinite(v) ? Math.max(5, Math.floor(v)) : 60;
  }

  return out;
}

async function ensureCurrentSettings() {
  const existing = await queryOne(
    "SELECT * FROM settings WHERE key = $1",
    [SETTINGS_KEY]
  );

  if (!existing) {
    await query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)`,
      [SETTINGS_KEY, JSON.stringify(DEFAULTS)]
    );
  }

  return await queryOne("SELECT * FROM settings WHERE key = $1", [SETTINGS_KEY]);
}

/* ----------------------------------------------------------------------------
 * Routes
 * ------------------------------------------------------------------------- */

/**
 * GET /api/settings
 * Returns the current settings.
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const row = await ensureCurrentSettings();
    if (!row) {
      return res.status(500).json({ error: "Failed to load settings" });
    }
    res.json(normalizeSettings(row));
  } catch (err: any) {
    console.error("GET /settings error", err);
    res.status(500).json({ error: err?.message || "Failed to fetch settings" });
  }
});

/**
 * PATCH /api/settings
 * Merge updates into the current settings.
 */
router.patch("/", async (req: Request, res: Response) => {
  try {
    const body: Partial<AppSettings> = req.body ?? {};
    const patch = sanitizePatch(body);

    const existing = await ensureCurrentSettings();
    if (!existing) {
      return res.status(500).json({ error: "Failed to load settings" });
    }

    const currentValue = existing.value as any;
    const mergedValue = { ...currentValue, ...patch };

    await query(
      `UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2`,
      [JSON.stringify(mergedValue), SETTINGS_KEY]
    );

    const updated = await queryOne("SELECT * FROM settings WHERE key = $1", [
      SETTINGS_KEY,
    ]);
    res.json(normalizeSettings(updated!));
  } catch (err: any) {
    console.error("PATCH /settings error", err);
    res.status(500).json({ error: err?.message || "Failed to update settings" });
  }
});

/**
 * PUT /api/settings
 * Replace the settings (keeps defaults for missing fields).
 */
router.put("/", async (req: Request, res: Response) => {
  try {
    const body: Partial<AppSettings> = req.body ?? {};
    const data = sanitizePatch(body);
    const mergedValue = { ...DEFAULTS, ...data };

    await query(
      `UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2`,
      [JSON.stringify(mergedValue), SETTINGS_KEY]
    );

    const updated = await queryOne("SELECT * FROM settings WHERE key = $1", [
      SETTINGS_KEY,
    ]);
    res.json(normalizeSettings(updated!));
  } catch (err: any) {
    console.error("PUT /settings error", err);
    res.status(500).json({ error: err?.message || "Failed to replace settings" });
  }
});

/**
 * GET /api/settings/history?limit=10
 * Returns settings history (not really used, but kept for compatibility).
 */
router.get("/history", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
    const rows = await query(
      "SELECT * FROM settings ORDER BY updated_at DESC LIMIT $1",
      [limit]
    );

    const items = rows.map(normalizeSettings);
    res.json({ items });
  } catch (err: any) {
    console.error("GET /settings/history error", err);
    res.status(500).json({ error: err?.message || "Failed to load settings history" });
  }
});

export default router;
