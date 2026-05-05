// backend/src/index.ts
import path from 'node:path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local env once, *before* importing anything that reads process.env
config({ path: path.join(__dirname, '../.env.local-only') });
config(); // Also load .env if it exists

const { app } = await import('./app.js');
const { testConnection } = await import('./database.js');

const PORT = Number(process.env.PORT ?? 8080);
// Cloud Run (and local) must bind to $PORT. Only skip listening when deployed as
// a serverless function (FUNCTION_TARGET is set).
if (!process.env.FUNCTION_TARGET) {
  app.listen(PORT, () => {
    console.log(`[server] API listening on port ${PORT}`);
    console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Test database connection in background (don't block server startup).
// Cloud Run expects the process to bind to $PORT quickly.
testConnection()
  .then((ok: boolean) => {
    if (!ok) {
      console.error(
        '[WARN] Database connection check failed. API is running but DB-backed endpoints may error.'
      );
    }
  })
  .catch((err: unknown) => {
    console.error('[WARN] Database connection check threw an error:', err);
  });

export default app;

