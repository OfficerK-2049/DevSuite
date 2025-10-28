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
      const { expression, timeZone, count, startDate } = req.query;
      const result = await CronService.previewRuns({ 
        expression, 
        timeZone, 
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
/*One night you'll wake up and you'll discover it never happened.
 It's all turned around on you and it never will. 
 Suddenly you are old, didn't happened and it never will, 
 'cause you were never going to do it anyway */

async function handlePreviewRequest(req, res) {
    const { expression, timezone, count, startDate, locale } = req.query;

    const result = await previewCronRuns(expression, timezone, count, startDate, locale);

    if (result.statusCode && result.statusCode >= 400) {
        return res.status(result.statusCode).json({
            status: 'error',
            code: result.code,
            message: result.message
        });
    } else {
        return res.status(200).json({
            status: 'success',
            data: result
        });
    }
}
