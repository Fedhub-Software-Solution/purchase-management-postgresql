// backend/src/database.ts
import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local-only') });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

// Support for Cloud SQL Unix socket connections
const isCloudSql = process.env.DB_HOST?.startsWith('/cloudsql/');
const dbHost = isCloudSql 
  ? process.env.DB_HOST 
  : (process.env.DB_HOST || 'localhost');

const sslEnabled =
  process.env.DB_SSL === 'true' ||
  (typeof databaseUrl === 'string' && /sslmode=require/i.test(databaseUrl));

const rejectUnauthorized =
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' ? true : false;

// Aiven over TLS can take a few seconds on cold starts; 2s is too aggressive.
const connectionTimeoutMillis = Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 10000);

const pool = new Pool(
  databaseUrl
    ? {
        connectionString: databaseUrl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis,
        ssl: sslEnabled ? { rejectUnauthorized } : false,
      }
    : {
        host: dbHost,
        port: isCloudSql ? undefined : parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'purchase_management',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis,
        ssl: sslEnabled ? { rejectUnauthorized } : false,
      }
);

// Test connection
pool.on('connect', () => {
  console.log('[postgres] Connected to database');
});

pool.on('error', (err) => {
  console.error('[postgres] Unexpected error on idle client', err);
  process.exit(-1);
});

export async function getDb(): Promise<PoolClient> {
  return await pool.connect();
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await getDb();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getDb();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Test connection on module load
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT NOW()');
    console.log('[postgres] Database connection verified');
    return true;
  } catch (err) {
    console.error('[postgres] Database connection failed:', err);
    return false;
  }
}

// Re-export for convenience
export { handleDbError } from './common.js';

export default pool;

