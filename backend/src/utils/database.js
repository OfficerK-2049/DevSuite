const { Pool } = require('pg');
const config = require('../config/database.config');
const logger = require('./logger');

const pool = new Pool(config);

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    logger.info('Connected to PostgreSQL database');
    client.release();
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms`);
    return result;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

export {
  connectDB,
  query,
  pool
};