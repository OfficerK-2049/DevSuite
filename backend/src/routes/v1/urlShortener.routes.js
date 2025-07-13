import express from 'express'
import URLShortenerController from '../../controllers/urlShortener.controller.js';
import { validateBody,validateParams } from '../../middleware/validation.middleware.js';
import { urlShortenSchema,shortIdSchema } from '../../utils/urlValidators.js';

const router=express.Router()

//json key's must always be quoted
router.post('/shorten',
  validateBody(urlShortenSchema),
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

