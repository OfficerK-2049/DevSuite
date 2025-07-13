import express from 'express'
import { validateBody,validateQuery } from '../../middleware/validation.middleware.js';
import {textInputSchema,
  base64QuerySchema,
  urlQuerySchema,
  slugifyQuerySchema,
  caseQuerySchema,
  morseQuerySchema} from '../../utils/textValidators.js'
import TextTransformController from '../../controllers/textTransform.controller.js';

const router=express.Router()

router.post('/base64',
    validateQuery(base64QuerySchema),
    validateBody(textInputSchema),
    TextTransformController.base64Transform
);
router.post('/url',
    validateQuery(urlQuerySchema),
    validateBody(textInputSchema),
    TextTransformController.urlTransform
);
router.post('/slugify',
    validateQuery(slugifyQuerySchema),
    validateBody(textInputSchema),
    TextTransformController.slugifyText
);
router.post('/case',
    validateQuery(caseQuerySchema),
    validateBody(textInputSchema),
    TextTransformController.convertCase
)
router.post('/morse',
    validateQuery(morseQuerySchema),
    validateBody(textInputSchema),
    TextTransformController.morseTransform
)

export default router;