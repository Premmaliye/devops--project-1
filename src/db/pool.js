const { Pool } = require('pg');

let pool = null;

const isDbConfigured = () => {
  return Boolean(
    process.env.DATABASE_URL ||
    (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER)
  );
};

const getPool = () => {
  if (!isDbConfigured()) {
    return null;
  }

  if (!pool) {
    const config = process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'energy_monitor',
          max: parseInt(process.env.DB_POOL_MAX || '20', 10),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 3000
        };

    pool = new Pool(config);

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }

  return pool;
};

const query = async (text, params) => {
  const p = getPool();
  if (!p) {
    throw new Error('Database is not configured');
  }
  return p.query(text, params);
};

const checkHealth = async () => {
  if (!isDbConfigured()) {
    return { status: 'NOT_CONFIGURED', driver: 'in-memory' };
  }
  try {
    const p = getPool();
    const res = await p.query('SELECT 1 as ok, NOW() as server_time');
    return {
      status: 'HEALTHY',
      server_time: res.rows[0].server_time
    };
  } catch (err) {
    return {
      status: 'UNHEALTHY',
      error: err.message
    };
  }
};

const close = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

module.exports = {
  isDbConfigured,
  getPool,
  query,
  checkHealth,
  close
};
