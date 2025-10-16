import express from 'express';
import TimeZoneController from '../../controllers/timeZone.controller.js'; 
import { ipValidation } from '../../middleware/validation.middleware.js'; //TODO refactor ip validation logic to fit codebase
//validators

const router = express.Router();

router.get('/now',ipValidation,TimeZoneController.getCurrentTime);

router.get('/lookup',ipValidation,TimeZoneController.lookupTimeZone);

export default router;