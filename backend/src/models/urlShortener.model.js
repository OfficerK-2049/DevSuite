const { query } = require('../utils/database');
const base62 = require('../utils/base62');
const logger = require('../utils/logger');

class URLShortenerModel {
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        short_id VARCHAR(20) UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        clicks INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        last_accessed TIMESTAMP NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_short_id ON urls(short_id);
      CREATE INDEX IF NOT EXISTS idx_expires_at ON urls(expires_at);
    `;
    
    try {
      await query(createTableQuery);
      logger.info('URLs table created successfully');
    } catch (error) {
      logger.error('Error creating URLs table:', error);
      throw error;
    }
  }

  static async create(originalUrl, expiresAt = null) {
    const insertQuery = `
      INSERT INTO urls (original_url, expires_at, short_id)
      VALUES ($1, $2, 'temp')
      RETURNING id, original_url, expires_at, created_at
    `;
    
    try {
      const result = await query(insertQuery, [originalUrl, expiresAt]);
      const urlRecord = result.rows[0];
      
      // Generate short_id using base62 encoding of the auto-incremented id
      const shortId = base62.encode(urlRecord.id);
      
      // Update the record with the generated short_id
      const updateQuery = `
        UPDATE urls 
        SET short_id = $1 
        WHERE id = $2 
        RETURNING *
      `;
      
      const updateResult = await query(updateQuery, [shortId, urlRecord.id]);
      return updateResult.rows[0];
    } catch (error) {
      logger.error('Error creating URL:', error);
      throw error;
    }
  }

  static async findByShortId(shortId) {
    const selectQuery = `
      SELECT * FROM urls 
      WHERE short_id = $1
    `;
    
    try {
      const result = await query(selectQuery, [shortId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding URL by short ID:', error);
      throw error;
    }
  }

  static async incrementClicks(shortId) {
    const updateQuery = `
      UPDATE urls 
      SET clicks = clicks + 1, last_accessed = CURRENT_TIMESTAMP
      WHERE short_id = $1
      RETURNING clicks, last_accessed
    `;
    
    try {
      const result = await query(updateQuery, [shortId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error incrementing clicks:', error);
      throw error;
    }
  }

  static async getAnalytics(shortId) {
    const selectQuery = `
      SELECT clicks, last_accessed, created_at, expires_at
      FROM urls 
      WHERE short_id = $1
    `;
    
    try {
      const result = await query(selectQuery, [shortId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting analytics:', error);
      throw error;
    }
  }
}

module.exports = URLShortenerModel;
