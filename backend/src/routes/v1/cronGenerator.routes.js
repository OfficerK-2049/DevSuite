import express from 'express';
import CronController from '../../controllers/cronGenerator.controller.js';
import { translateSchema, previewSchema } from '../../utils/cronValidators.js';
import { validateQuery } from '../../middleware/validation.middleware.js';

const router = express.Router();

router.get('/translate',
  validateQuery(translateSchema),
  CronController.translateExpression
);

router.get('/preview',
  validateQuery(previewSchema),
  CronController.previewRuns
);

export default router;