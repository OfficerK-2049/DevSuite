import Joi from 'joi';
import { IANAZone } from 'luxon';

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


// Custom validator for IANA timezone
const validateIANAZone = (value, helpers) => {
  const zone = IANAZone.create(value);
  if (!zone.isValid) {
    return helpers.error('any.invalid');
  }
  return value;
};

// Schema for /convert endpoint
export const convertSchema = Joi.object({
  dateTime: Joi.string()
    .required()
    .messages({
      'string.empty': 'dateTime is required',
      'any.required': 'dateTime parameter is required'
    }),
  fromZone: Joi.string()
    .custom(validateIANAZone)
    .messages({
      'any.invalid': 'fromZone must be a valid IANA timezone identifier'
    }),
  toZone: Joi.string()
    .required()
    .custom(validateIANAZone)
    .messages({
      'string.empty': 'toZone is required',
      'any.required': 'toZone parameter is required',
      'any.invalid': 'toZone must be a valid IANA timezone identifier'
    })
});

// Schema for /format endpoint
export const formatSchema = Joi.object({
  dateTime: Joi.string()
    .required()
    .messages({
      'string.empty': 'dateTime is required',
      'any.required': 'dateTime parameter is required'
    }),
  displayZone: Joi.string()
    .required()
    .custom(validateIANAZone)
    .messages({
      'string.empty': 'displayZone is required',
      'any.required': 'displayZone parameter is required', //!displayZone is not mandatory
      'any.invalid': 'displayZone must be a valid IANA timezone identifier'
    }),
  format: Joi.string()
    .required()
    .messages({
      'string.empty': 'format is required',
      'any.required': 'format parameter is required'
    }),
  locale: Joi.string()
    .pattern(/^[a-z]{2}-[A-Z]{2}$/)
    .messages({
      'string.pattern.base': 'locale must be a valid BCP 47 tag (e.g., en-US)'
    })
});