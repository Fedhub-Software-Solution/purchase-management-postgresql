// backend/src/common.ts
import { z } from 'zod';
import { Request, Response } from 'express';

export function paginate<T>(items: T[], limit: number, pageToken?: string) {
  const start = pageToken ? parseInt(Buffer.from(pageToken, 'base64').toString('utf8')) : 0;
  const end = Math.min(start + limit, items.length);
  const nextPageToken = end < items.length ? Buffer.from(String(end)).toString('base64') : null;
  return {
    items: items.slice(start, end),
    nextPageToken
  };
}

export function parseListParams(req: Request) {
  const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || '25'))));
  const pageToken = req.query.pageToken ? String(req.query.pageToken) : undefined;
  return { limit, pageToken };
}

export function sendZodError(res: Response, error: z.ZodError) {
  return res.status(400).json({ error: 'ValidationError', details: error.flatten() });
}

// PostgreSQL pagination helpers
export function getOffset(pageToken?: string): number {
  if (!pageToken) return 0;
  try {
    const n = parseInt(Buffer.from(pageToken, 'base64').toString(), 10);
    if (!Number.isFinite(n) || n < 0) return 0;
    return n;
  } catch {
    return 0;
  }
}

export function createPageToken(offset: number, limit: number, hasMore: boolean): string | null {
  return hasMore ? Buffer.from(String(offset + limit)).toString('base64') : null;
}

// Database error handling
export function handleDbError(err: any, res: Response) {
  if (err.code === '23505') {
    // Unique violation — suppliers.name is UNIQUE and names are backfilled from purchase_items (005_suppliers.sql)
    const constraint = String(err.constraint || '');
    if (constraint === 'suppliers_name_key') {
      return res.status(409).json({
        error:
          'A supplier with this name already exists. Names from past purchases were imported automatically; edit that supplier or use a different name.',
      });
    }
    return res.status(409).json({ error: 'Duplicate entry' });
  }
  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({ error: 'Referenced record not found' });
  }
  if (err.code === '23502') { // Not null violation
    return res.status(400).json({ error: 'Required field is missing' });
  }
  if (err.code === '42703') {
    // undefined_column — production DB often missing a migration
    return res.status(500).json({
      error:
        'Database schema mismatch (missing column). Run all SQL migrations in database/migrations on the production database, in order.',
    });
  }
  if (err.code === '42P01') {
    // undefined_table
    return res.status(500).json({
      error:
        'Database is missing required tables (e.g. suppliers). Run database/migrations on the production PostgreSQL instance, starting from 001_initial_schema.sql through the latest migration.',
    });
  }
  console.error('Database error:', err?.code, err?.message, err);
  return res.status(500).json({ error: 'Database error', message: process.env.NODE_ENV === 'development' ? err.message : undefined });
}

