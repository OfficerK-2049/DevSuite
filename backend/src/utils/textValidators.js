import Joi from 'joi'

const textInputSchema = Joi.object({
  input: Joi.string()
    .required()
    .min(1)
    .max(100000) // 100KB limit for text input
    .messages({
      'string.empty': 'Input text cannot be empty',
      'string.min': 'Input text cannot be empty',
      'string.max': 'Input text is too large (max 100KB)',
      'any.required': 'Input field is required'
    })
});

const base64QuerySchema = Joi.object({
  op: Joi.string()
    .valid('encode', 'decode')
    .required()
    .messages({
      'any.only': 'Operation must be either "encode" or "decode"',
      'any.required': 'Operation parameter is required'
    })
});

const urlQuerySchema = Joi.object({
  op: Joi.string()
    .valid('encode', 'decode')
    .required()
    .messages({
      'any.only': 'Operation must be either "encode" or "decode"',
      'any.required': 'Operation parameter is required'
    })
});

const slugifyQuerySchema = Joi.object({
  separator: Joi.string()
    .valid('hyphen', 'underscore')
    .default('hyphen')
    .messages({
      'any.only': 'Separator must be either "hyphen" or "underscore"'
    })
});

const caseQuerySchema = Joi.object({
  type: Joi.string()
    .valid('upper', 'lower', 'title', 'camel', 'snake', 'kebab', 'pascal')
    .required()
    .messages({
      'any.only': 'Type must be one of: upper, lower, title, camel, snake, kebab, pascal',
      'any.required': 'Type parameter is required'
    })
});

const morseQuerySchema = Joi.object({
  op: Joi.string()
    .valid('encode', 'decode')
    .required()
    .messages({
      'any.only': 'Operation must be either "encode" or "decode"',
      'any.required': 'Operation parameter is required'
    })
});

export {
  textInputSchema,
  base64QuerySchema,
  urlQuerySchema,
  slugifyQuerySchema,
  caseQuerySchema,
  morseQuerySchema
}