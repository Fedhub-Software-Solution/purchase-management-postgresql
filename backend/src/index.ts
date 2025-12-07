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

// Test database connection
const dbConnected = await testConnection();
if (!dbConnected) {
  console.error('[ERROR] Failed to connect to database. Please check your configuration.');
  process.exit(1);
}

const PORT = Number(process.env.PORT ?? 8080);
if (!process.env.FUNCTION_TARGET && process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[server] Local API listening on http://localhost:${PORT}`);
    console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;

