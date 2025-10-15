import Joi from 'joi';

// Common validation schema for location parameters
const locationSchema = Joi.object({
  city: Joi.string().trim().min(1).max(100),
  country: Joi.string().trim().min(1).max(100),
  lat: Joi.number().min(-90).max(90),
  lon: Joi.number().min(-180).max(180),
  ip: Joi.string().ip(),
  format: Joi.string().valid('json', 'text').default('json')
}).min(1).message('At least one location parameter (city, country, lat, lon, or ip) is required');

// Validation for the /now endpoint
export const validateGetCurrentTime = (req, res, next) => {
  const { error } = locationSchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message
    });
  }
  
  next();
};

// Validation for the /lookup endpoint
export const validateLookupTimeZone = (req, res, next) => {
  const schema = Joi.object({
    ...locationSchema.extract(['city', 'country', 'lat', 'lon', 'ip']),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message('Date must be in YYYY-MM-DD format')
  }).min(1).message('At least one location parameter (city, country, lat, lon, or ip) is required');

  const { error } = schema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message
    });
  }
  
  // Validate coordinate pairs - if lat is provided, lon must also be provided and vice versa
  if ((req.query.lat && !req.query.lon) || (!req.query.lat && req.query.lon)) {
    return res.status(400).json({
      status: 'error',
      message: 'Both latitude and longitude must be provided together'
    });
  }
  
  next();
};