import express from 'express'
import { shortIdSchema } from '../../utils/validators';
import URLShortenerController from '../../controllers/urlShortener.controller';

const router=express.Router()


router.post('/shorten',
  validateParams(shortIdSchema),
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

