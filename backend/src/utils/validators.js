import Joi from 'joi'

const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

const urlShortenSchema = Joi.object({
  originalUrl: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .messages({
      'string.uri': 'Please provide a valid HTTP/HTTPS URL',
      'any.required': 'Original URL is required'
    }),
  expiresIn: Joi.string()
    .optional()
    .allow('', null)
    .pattern(/^\d+[smhdwy]$/)
    .messages({
      'string.pattern.base': 'Invalid expiry format. Use formats like "7d", "24h", "30m"'
    })
});

const shortIdSchema = Joi.object({
  shortId: Joi.string()
    .alphanum()
    .min(1)
    .max(20)
    .required()
    .messages({
      'string.alphanum': 'Short ID must be alphanumeric',
      'any.required': 'Short ID is required'
    })
});

export {isValidUrl,urlShortenSchema,shortIdSchema}