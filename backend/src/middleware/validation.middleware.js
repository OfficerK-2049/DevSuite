
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



const validateIp=(schema)=>{
 return (req, res, next)=> {
        const { error } = schema.validate(req.query.ip);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Malformed input',
                details: error.details.map(detail => detail.message)
            });
        }

    next();
}
}

export {validateBody,validateParams,validateQuery,validateIp}