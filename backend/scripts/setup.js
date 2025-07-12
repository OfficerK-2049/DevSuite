import "dotenv/config"
import { connectDB } from "../src/utils/database.js";
import URLShortenerModel from "../src/models/urlShortener.model.js";
import logger from "../src/utils/logger.js";

async function setup() {
  try {
    logger.info('Starting database setup...');
    
    await connectDB(); //!requires environment variable config , so perform setup after starting the main server
    logger.info('Database connected successfully in setup');
    
    await URLShortenerModel.createTable();
    logger.info('Database tables created successfully');
    
    logger.info('Setup completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Setup failed:', error);
    process.exit(1);
  }
}

setup();
