import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';
import { DateTime } from 'luxon';

class CronService {
  static async translateExpression({ expression, locale }) {
    try {
        //validation
      CronExpressionParser.parse(expression);

      const options = locale ? { locale } : {};
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

  static async previewRuns({ expression, timezone, count = 5, startDate }) {
    const warnings = [];
    let moment;

    if (startDate) {
      const offsetRegex = /[+-]\d{2}:\d{2}|Z$/;
      const hasOffset = offsetRegex.test(startDate);
    //TODO refactor redundant logic
      if (hasOffset) {
        moment = DateTime.fromISO(startDate);
        if (!moment.isValid) {
          throw {
            statusCode: 400,
            message: `Invalid startDate: ${moment.invalidReason}`,
            code: 'INVALID_START_DATE'
          };
        }
        // Convert to target timezone
        moment = moment.setZone(timezone);
      } else {
        // Floating time - interpret in target timezone
        moment = DateTime.fromISO(startDate, { zone: timezone });
        if (!moment.isValid) {
          throw {
            statusCode: 400,
            message: `Invalid startDate: ${moment.invalidReason}`,
            code: 'INVALID_START_DATE'
          };
        }
        warnings.push('Interpreted floating startDate within the specified timezone.');
      }
    } else {
      // Default to now in target timezone
      moment = DateTime.now().setZone(timezone);
      warnings.push('Defaulted startDate to "now" in the target timezone.');
    }

    // Validate and parse cron expression
    let cronIterator;
    try {
      const options = {
        currentDate: moment.toJSDate(),
        tz: timezone,
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
        const nextRunDateTime = DateTime.fromJSDate(nextRun.value.toDate(), { zone: timezone });
        nextRuns.push(nextRunDateTime.toISO());
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
      timezone,
      nextRuns,
      warnings,
      error: null
    };
  }
}

export default CronService; 