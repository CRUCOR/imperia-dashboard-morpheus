/**
 * Database Configuration
 * PostgreSQL connection pool setup
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'imperia_db',
  user: process.env.DB_USER || 'imperia_user',
  password: process.env.DB_PASSWORD || 'imperia_password',
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✓ Database connected');
});

pool.on('error', (err) => {
  console.error('✗ Unexpected database error:', err);
  process.exit(-1);
});

export default pool;
