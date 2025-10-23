import TimeZoneService from '../services/timeZone.service.js';

class TimeZoneController {
  static async getCurrentTime(req, res, next) {
    try {
      const { city, country, lat, lon, ip } = req.query;
      
      // Validate that at least one location identifier is provided
      if (!city && !country && !lat && !lon && !ip) {
        return res.status(400).json({
          success:false,
          status: 'error',
          message: 'At least one location identifier (city, country, lat/lon, or ip) must be provided'
        });
      }
      
      const result = await TimeZoneService.getCurrentTime({ city, country, lat, lon, ip });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async lookupTimeZone(req, res, next) {
    try {
      const { city, country, lat, lon, ip } = req.query;
      const referenceDate = req.query.date || new Date().toISOString().split('T')[0]; // Default to today
      
      // Validate that at least one location identifier is provided
      if (!city && !country && !lat && !lon && !ip) {
        return res.status(400).json({
          success:false,
          status: 'error',
          message: 'At least one location identifier (city, country, lat/lon, or ip) must be provided'
        });
      }
      
      const result = await TimeZoneService.lookupTimeZone({ city, country, lat, lon, ip, referenceDate });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  static async convertTime(req, res, next) {
  try {
    const { dateTime, fromZone, toZone } = req.query;
    const result = await TimeZoneService.convertTime({ dateTime, fromZone, toZone });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

  static async formatTime(req, res, next) {
  try {
    const { dateTime, displayZone, format, locale } = req.query;
    const result = await TimeZoneService.formatTime({ dateTime, displayZone, format, locale });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
}

export default TimeZoneController;