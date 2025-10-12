import TimeZoneService from '../services/timeZone.service.js';

class TimeZoneController {
  static async getCurrentTime(req, res, next) {
    try {
      const { city, country, lat, lon, ip, format } = req.query;
      
      // Validate that at least one location identifier is provided
      if (!city && !country && !lat && !lon && !ip) {
        return res.status(400).json({
          status: 'error',
          message: 'At least one location identifier (city, country, lat/lon, or ip) must be provided'
        });
      }
      
      const result = await TimeZoneService.getCurrentTime({ city, country, lat, lon, ip, format });
      
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
}

export default TimeZoneController;