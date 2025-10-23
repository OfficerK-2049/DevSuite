import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    code:err.code || "",
    statusCode: err.statusCode || 500 
  };

  // PostgreSQL errors
  if (err.code === '23505') {
    error.message = 'Duplicate entry';
    error.statusCode = 409;
  } else if (err.code === '23503') {
    error.message = 'Referenced record not found';
    error.statusCode = 404;
  } else if (err.code === 'ECONNREFUSED') {
    error.message = 'Database connection failed';
    error.statusCode = 503;
  }

  // Custom application errors
  if (err.name === 'ValidationError') {
    error.message = err.message;
    error.statusCode = 400;
  }

  // Don't expose stack trace in production
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }

  res.status(error.statusCode).json(error);
};

export default errorHandler;