// backend/src/routes/health.ts
import { Router, Request, Response } from 'express';
import { query } from '../database.js';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint with database connectivity test
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Test database connection
    await query('SELECT NOW()');
    
    res.json({
      ok: true,
      uptime: process.uptime(),
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      ok: false,
      uptime: process.uptime(),
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

