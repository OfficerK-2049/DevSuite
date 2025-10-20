import express from 'express';
import TimeZoneController from '../../controllers/timeZone.controller.js'; 
import { ipSchema } from '../../utils/ipUtils.js';
import { validateIp,validateQuery } from '../../middleware/validation.middleware.js'; 
import { convertSchema, formatSchema } from '../../utils/timeValidators.js';

const router = express.Router();

router.get('/now',
    validateIp(ipSchema),
    TimeZoneController.getCurrentTime);

router.get('/lookup',
    validateIp(ipSchema),
    TimeZoneController.lookupTimeZone);

router.get('/convert',
  validateQuery(convertSchema),
  TimeZoneController.convertTime
);

router.get('/format',
  validateQuery(formatSchema),
  TimeZoneController.formatTime
);

export default router;