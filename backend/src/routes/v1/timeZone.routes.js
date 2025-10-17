import express from 'express';
import TimeZoneController from '../../controllers/timeZone.controller.js'; 
import { ipSchema } from '../../utils/ipUtils.js';
import { validateIp } from '../../middleware/validation.middleware.js'; //TODO done
//validators

const router = express.Router();

router.get('/now',
    validateIp(ipSchema),
    TimeZoneController.getCurrentTime);

router.get('/lookup',
    validateIp(ipSchema),
    TimeZoneController.lookupTimeZone);

export default router;