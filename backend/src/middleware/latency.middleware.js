import logger from '../utils/logger.js'; 

const requestLatencyMonitor = (req, res, next) => {
  const startHrTime = process.hrtime.bigint(); // High-resolution time

  res.on('finish', () => {
    const endHrTime = process.hrtime.bigint();
    const durationInMs = Number(endHrTime - startHrTime) / 1_000_000; // Convert nanoseconds to milliseconds

    logger.info(
      `Request Latency: ${req.method} ${req.originalUrl} - ${durationInMs.toFixed(2)}ms`
    );
  });

  next();
};

export default requestLatencyMonitor;
