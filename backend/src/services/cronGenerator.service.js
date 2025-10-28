import cronstrue from 'cronstrue/i18n.js';
import { CronExpressionParser } from 'cron-parser';
import { DateTime } from 'luxon';

class CronService {
  static async translateExpression({ expression, locale }) {
    let warnings=[]
    try {
        expression=expression.replace(/_/g, ' ');

        //validation
      CronExpressionParser.parse(expression);

    //TODO add warnings as only some locales are supported
      const options = locale ? { locale } : {}; 
    //   console.log(options)
      const humanReadable = cronstrue.toString(expression, options);

      return {
        isValid: true,
        humanReadable,
        expression,
        error: null
      };
    } catch (error) {
      return {
        isValid: false,
        humanReadable: null,
        expression,
        error: error.message || 'Invalid cron expression'
      };
    }
  }

  static async previewRuns({ expression, timeZone, count = 5, startDate }) {
    //TODO add provision for locale
    const warnings = [];
    let moment;

    expression=expression.replace(/_/g, ' ');
     //handle encoding for + offset
    startDate=startDate?startDate.replace(/ (\d{2}:\d{2})$/, '+$1'):"";

    if (startDate) {
      const offsetRegex = /[+-]\d{2}:\d{2}|Z$/;
      const hasOffset = offsetRegex.test(startDate);
    //TODO refactor redundant logic
      if (hasOffset) {
        moment = DateTime.fromISO(startDate);
        console.log("has offset : ",moment)
        if (!moment.isValid) {
          throw {
            statusCode: 400,
            message: `Invalid startDate: ${moment.invalidReason}`,
            code: 'INVALID_START_DATE'
          };
        }
        // Convert to target timezone
        moment = moment.setZone(timeZone);
      } else {
        // Floating time - interpret in target timezone
        moment = DateTime.fromISO(startDate, { zone: timeZone });
        if (!moment.isValid) {
          throw {
            statusCode: 400,
            message: `Invalid startDate: ${moment.invalidReason}`,
            code: 'INVALID_START_DATE'
          };
        }
        warnings.push('Interpreted floating startDate within the specified timeZone.');
      }
    } else {
      // Default to now in target timezone
      moment = DateTime.now().setZone(timeZone);
      warnings.push('Defaulted startDate to \"now"\ in the target timezone.');
    }

    // Validate and parse cron expression
    let cronIterator;
    try {
      const options = {
        currentDate: moment.toJSDate(),
        tz: timeZone,
        iterator: true
      };
      cronIterator = CronExpressionParser.parse(expression, options);
    } catch (error) {
      throw {
        statusCode: 400,
        message: `Invalid cron expression: ${error.message}`,
        code: 'INVALID_CRON_EXPRESSION'
      };
    }

    // Generate next runs
    const nextRuns = [];
    try {
      for (let i = 0; i < count; i++) {
        const nextRun = cronIterator.next();
        const nextRunDateTime = DateTime.fromJSDate(nextRun.toDate());
        console.log("Runs : ",nextRunDateTime.setZone(timeZone))
        nextRuns.push(nextRunDateTime.setZone(timeZone).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY));
      }
    } catch (error) {
      throw {
        statusCode: 500,
        message: `Error generating preview runs: ${error.message}`,
        code: 'PREVIEW_GENERATION_ERROR'
      };
    }

    return {
      isValid: true,
      expression,
      timeZone,
      nextRuns,
      warnings,
      error: null
    };
  }
}

export default CronService; 
