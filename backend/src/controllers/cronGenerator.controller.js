import CronService from '../services/cronGenerator.service.js';

class CronController {
  static async translateExpression(req, res, next) {
    try {
      const { expression, locale } = req.query;
      const result = await CronService.translateExpression({ expression, locale });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async previewRuns(req, res, next) {
    try {
      const { expression, timezone, count, startDate } = req.query;
      const result = await CronService.previewRuns({ 
        expression, 
        timezone, 
        count: count ? parseInt(count) : 5, 
        startDate 
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default CronController;