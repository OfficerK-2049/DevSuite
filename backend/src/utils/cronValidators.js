import Joi from 'joi';
import { validateIANAZone } from './timeValidators.js';

// Schema for /translate endpoint
export const translateSchema = Joi.object({
  expression: Joi.string()
    .required()
    .messages({
      'string.empty': 'expression is required',
      'any.required': 'expression parameter is required'
    }),
  locale: Joi.string()
    .pattern(/^[a-z]{2}(-[A-Z]{2})?$/)
    .messages({
      'string.pattern.base': 'locale must be a valid BCP 47 tag (e.g., en or en-US)'
    })
});

// Schema for /preview endpoint
export const previewSchema = Joi.object({
  expression: Joi.string()
    .required()
    .messages({
      'string.empty': 'expression is required',
      'any.required': 'expression parameter is required'
    }),
  timezone: Joi.string()
    .required()
    .custom(validateIANAZone)
    .messages({
      'string.empty': 'timezone is required',
      'any.required': 'timezone parameter is required',
      'any.invalid': 'timezone must be a valid IANA timezone identifier'
    }),
  count: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .default(5)
    .messages({
      'number.base': 'count must be a number',
      'number.integer': 'count must be an integer',
      'number.min': 'count must be at least 1',
      'number.max': 'count cannot exceed 20'
    }),
  startDate: Joi.string()
    .messages({
      'string.base': 'startDate must be a string'
    })
});