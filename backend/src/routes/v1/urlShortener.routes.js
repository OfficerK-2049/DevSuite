import express from 'express'
import URLShortenerController from '../../controllers/urlShortener.controller.js';
import { validate,validateParams } from '../../middleware/validation.middleware.js';
import { urlShortenSchema,shortIdSchema } from '../../utils/validators.js';

const router=express.Router()

//json key's must always be quoted
router.post('/shorten',
  validate(urlShortenSchema),
  URLShortenerController.shortenUrl
);

router.get('/analytics/:shortId',
  validateParams(shortIdSchema),
  URLShortenerController.getAnalytics
);

router.get('/:shortId',
  validateParams(shortIdSchema),
  URLShortenerController.redirectToOriginal
);

export default router

