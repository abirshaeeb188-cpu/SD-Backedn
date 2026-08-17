import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

console.log('DATABASE_URL exists:', Boolean(process.env.DATABASE_URL));

const usingConnectionString = Boolean(process.env.DATABASE_URL);

const connectionConfig = usingConnectionString
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'desert_sands_builders',
    };

if (usingConnectionString) {
  connectionConfig.ssl = {
    rejectUnauthorized: false,
  };
}

export const pool = new Pool(connectionConfig);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error on idle client', err);
});

export async function query(text, params) {
  return pool.query(text, params);
}

export default pool;
