import { validateIp } from "../utils/ipUtils.js";

const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        details: error.details.map(detail => detail.message)
      });
    }
    
    // req.query = value; //!req.query is read-only in newer versions of express
    // Replace query with validated and defaulted values
    Object.assign(req.query, value);
    next();
  };
};



const ipValidation=(req, res, next)=> {
    const ip = req.query.ip;

    if (ip) {
        // If the IP parameter exists, run it through the Joi validator
        const validationError = validateIp(ip);
        
        if (validationError) {
            // Stop the request and send the error defined in the utility
            return res.status(validationError.statusCode).json({
                status: 'error',
                code: 'MALFORMED_INPUT',
                message: validationError.message
            });
        }
    }
    // Proceed to the controller if validation passes or if 'ip' is not present
    next();
}


export {validateBody,validateParams,validateQuery,ipValidation}