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
import { validateBody,validateQuery } from '../../middleware/validation.middleware.js';
import {textInputSchema,
  base64QuerySchema,
  urlQuerySchema,
  slugifyQuerySchema,
  caseQuerySchema,
  morseQuerySchema} from '../../utils/textValidators.js'

const router=express.Router()

router.post('/base64',
    validateQuery(base64QuerySchema),
    validateBody(textInputSchema),
    textTransformController
);
router.post('/url',
    validateQuery(urlQuerySchema),
    validateBody(textInputSchema),
    textTransformController
);
router.post('/slugify',
    validateQuery(slugifyQuerySchema),
    validateBody(textInputSchema),
    textTransformController
);
router.post('/case',
    validateQuery(caseQuerySchema),
    validateBody(textInputSchema),
    textTransformController
)
router.post('/morse',
    validateQuery(morseQuerySchema),
    validateBody(textInputSchema),
    textTransformController
)

export default router