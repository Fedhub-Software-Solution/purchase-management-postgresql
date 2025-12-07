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
    return parseInt(Buffer.from(pageToken, 'base64').toString());
  } catch {
    return 0;
  }
}

export function createPageToken(offset: number, limit: number, hasMore: boolean): string | null {
  return hasMore ? Buffer.from(String(offset + limit)).toString('base64') : null;
}

// Database error handling
export function handleDbError(err: any, res: Response) {
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({ error: 'Duplicate entry' });
  }
  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({ error: 'Referenced record not found' });
  }
  if (err.code === '23502') { // Not null violation
    return res.status(400).json({ error: 'Required field is missing' });
  }
  console.error('Database error:', err);
  return res.status(500).json({ error: 'Database error', message: process.env.NODE_ENV === 'development' ? err.message : undefined });
}

