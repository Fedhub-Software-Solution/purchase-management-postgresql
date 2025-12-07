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

// Support for Cloud SQL Unix socket connections
const isCloudSql = process.env.DB_HOST?.startsWith('/cloudsql/');
const dbHost = isCloudSql 
  ? process.env.DB_HOST 
  : (process.env.DB_HOST || 'localhost');

const pool = new Pool({
  host: dbHost,
  port: isCloudSql ? undefined : parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'purchase_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

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

