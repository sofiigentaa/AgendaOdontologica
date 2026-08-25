import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool
export const createPool = () => {
  if (!global._postgresPool) {
    const databaseUrl = process.env.DATABASE_URL || process.env.SQL_DATABASE_URL;
    
    let config: PoolConfig = {
      max: 10,
      connectionTimeoutMillis: 15000,
    };

    if (databaseUrl) {
      config.connectionString = databaseUrl;
      // Enable SSL for cloud PostgreSQL (like Render / Supabase / Neon)
      if (!databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1')) {
        config.ssl = { rejectUnauthorized: false };
      }
    } else if (process.env.SQL_HOST) {
      config = {
        ...config,
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
      };
      if (process.env.SQL_HOST !== 'localhost' && process.env.SQL_HOST !== '127.0.0.1') {
        config.ssl = { rejectUnauthorized: false };
      }
    } else {
      // Fallback dummy config when no database env vars are provided
      config = {
        ...config,
        host: 'localhost',
        database: 'postgres',
      };
    }

    global._postgresPool = new Pool(config);

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance
const pool = createPool();

// Initialize Drizzle with the pool and schema
export const db = drizzle(pool, { schema });
