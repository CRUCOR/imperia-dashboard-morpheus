/**
 * Configuration Index
 * Centralized configuration exports
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  morpheusUrl: process.env.MORPHEUS_SERVICE_URL || 'http://morpheus-triton-service:8000',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'imperia_db',
    user: process.env.DB_USER || 'imperia_user',
    password: process.env.DB_PASSWORD || 'imperia_password',
  },
};

export * from './database';
