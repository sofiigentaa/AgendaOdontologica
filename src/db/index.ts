import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const isDbConfigured = Boolean(
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME)
);

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (connectionString) {
      global._postgresPool = new Pool({
        connectionString,
        ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else if (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME) {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else {
      global._postgresPool = new Pool({
        host: '127.0.0.1',
        port: 5432,
        max: 1,
        connectionTimeoutMillis: 1000,
      });
    }

    global._postgresPool.on('error', (err) => {
      if (isDbConfigured) {
        console.error('Unexpected error on idle SQL pool client:', err);
      }
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
export { schema };

