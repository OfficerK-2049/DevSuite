import express from 'express';
import TimeZoneController from '../../controllers/timeZone.controller.js';

const router = express.Router();

router.get('/now', TimeZoneController.getCurrentTime);

router.get('/lookup', TimeZoneController.lookupTimeZone);

export default router;