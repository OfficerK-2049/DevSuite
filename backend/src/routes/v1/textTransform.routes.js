/*const express = require('express');
const TextTransformController = require('../../controllers/textTransform.controller');
const { validate } = require('../../middleware/validation.middleware');
const { validateQuery } = require('../../middleware/queryValidation.middleware');
const {
  textInputSchema,
  base64QuerySchema,
  urlQuerySchema,
  slugifyQuerySchema,
  caseQuerySchema,
  morseQuerySchema
} = require('../../utils/textValidators');

const router = express.Router();

// POST /api/v1/text/base64?op=encode/decode
router.post('/base64',
  validateQuery(base64QuerySchema),
  validate(textInputSchema),
  TextTransformController.base64Transform
);

// POST /api/v1/text/url?op=encode/decode
router.post('/url',
  validateQuery(urlQuerySchema),
  validate(textInputSchema),
  TextTransformController.urlTransform
);

// POST /api/v1/text/slugify?separator=hyphen/underscore
router.post('/slugify',
  validateQuery(slugifyQuerySchema),
  validate(textInputSchema),
  TextTransformController.slugifyText
);

// POST /api/v1/text/case?type=upper/lower/title/camel/snake/kebab/pascal
router.post('/case',
  validateQuery(caseQuerySchema),
  validate(textInputSchema),
  TextTransformController.convertCase
);

// POST /api/v1/text/morse?op=encode/decode
router.post('/morse',
  validateQuery(morseQuerySchema),
  validate(textInputSchema),
  TextTransformController.morseTransform
);

module.exports = router;*/

import express from 'express'

const router=express.Router()

router.post('/base64',
    validateQuery(base64QuerySchema),
    validate(textInputSchema),
    textTransformController.base64Transform
);
router.post('/url',
    validateQuery(url4QuerySchema),
    validate(textInputSchema),
    textTransformController.urlTransform
);
router.post('/slugify',
    validateQuery(slugifyQuerySchema),
    validate(textInputSchema),
    textTransformController.slugifyText
);
router.post('/case')
router.post('/morse')

export default router