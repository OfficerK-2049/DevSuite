/*const URLShortenerService = require('../services/urlShortener.service');
const logger = require('../utils/logger');

class URLShortenerController {
  static async shortenUrl(req, res, next) {
    try {
      const { originalUrl, expiresIn } = req.body;
      
      const result = await URLShortenerService.shortenUrl(originalUrl, expiresIn);
      
      res.status(201).json({
        success: true,
        message: 'URL shortened successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async redirectToOriginal(req, res, next) {
    try {
      const { shortId } = req.params;
      
      const result = await URLShortenerService.getOriginalUrl(shortId);
      
      if (result.error) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.error
        });
      }
      
      logger.info(`Redirecting ${shortId} to ${result.originalUrl}`);
      res.redirect(result.originalUrl);
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(req, res, next) {
    try {
      const { shortId } = req.params;
      
      const result = await URLShortenerService.getAnalytics(shortId);
      
      if (result.error) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.error
        });
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = URLShortenerController;*/

import URLShortenerService from "../services/urlShortener.service.js";
import logger from "../utils/logger.js";

//*errors propagate ; error responses are sent from there
//?why don't we handle error responses from global middleware
//?should I have a message property or no?

class URLShortenerController{
    static async shortenUrl(req,res,next)
    {
        try{
            const {originalUrl,expiresIn}=req.body;
            
            const result=await URLShortenerService.shortenUrl(originalUrl,expiresIn);

            res.status(201).json({
                success:true,
                message:'URL Successfully Shortened ',
                data:result
            })

        }
        catch(error){
            next(error);
        }

    }

    static async getAnalytics(req,res,next){
      try{
        const {shortId}=req.params
        const result=await URLShortenerService.getAnalytics(shortId)

        if(result.error){
          return res.status(result.statusCode).json({
            success:false,
            message:result.error
          })
        }

        res.status(200).json({    
          success:'true',
          message:'URL Analytics Fetched Successfully',
          data:result
        }) 

      }
      catch(error){
        next(error)
      }
        
    }

    static async redirectToOriginal(req,res,next){
      try{
        const {shortId}=req.params;
        const result=await URLShortenerService.getOriginalUrl(shortId)

        if(result.error){
          return res.status(result.statusCode).json({
            success:false,
            message:result.error
          })
        }
        //handle redirect
        logger.info(`Redirecting ${shortId} to ${result.originalUrl}`);
        res.redirect(result.originalUrl);
      }
      catch(error){
        next(error);
      }

    }
}

export default URLShortenerController