import ms from 'ms'

const parseTimeToMs = (timeString) => {
  if (!timeString || timeString === '') return null;
  
  try {
    const milliseconds = ms(timeString);
    if (!milliseconds || milliseconds <= 0) {
      throw new Error('Invalid time format');
    }
    return milliseconds;
  } catch (error) {
    throw new Error(`Invalid time format: ${timeString}. Use formats like '7d', '24h', '30m'`);
  }
};

const parseExpiryTime = (expiresIn) => {
  if (!expiresIn || expiresIn === '') return null;
  
  const milliseconds = parseTimeToMs(expiresIn);
  if (!milliseconds) return null;
  
  return new Date(Date.now() + milliseconds);
};

export  {
  parseTimeToMs,
  parseExpiryTime
};