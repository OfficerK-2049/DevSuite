import TextTransformService from "../services/textTransform.service.js";

class TextTransformController {
  static async base64Transform(req, res, next) {
    try {
      const { input } = req.body;
      const { op } = req.query;
      
      const result = await TextTransformService.base64Transform(input, op);
      
      res.json({
        success: true,
        message: `Base64 ${op} completed successfully`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async urlTransform(req, res, next) {
    try {
      const { input } = req.body;
      const { op } = req.query;
      
      const result = await TextTransformService.urlTransform(input, op);
      
      res.json({
        success: true,
        message: `URL ${op} completed successfully`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async slugifyText(req, res, next) {
    try {
      const { input } = req.body;
      const { separator = 'hyphen' } = req.query;
      
      const result = await TextTransformService.slugifyText(input, separator);
      
      res.json({
        success: true,
        message: 'Text slugified successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async convertCase(req, res, next) {
    try {
      const { input } = req.body;
      const { type } = req.query;
      
      const result = await TextTransformService.convertCase(input, type);
      
      res.json({
        success: true,
        message: `Case converted to ${type} successfully`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async morseTransform(req, res, next) {
    try {
      const { input } = req.body;
      const { op } = req.query;
      
      const result = await TextTransformService.morseTransform(input, op);
      
      res.json({
        success: true,
        message: `Morse ${op} completed successfully`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

/*class TextTransformController{
  static async base64Transform(req,res,next)
  {
    try{
      const {input}=req.body
      const {op}=req.params

      const result=await TextTransformService.base64Transform(input,op);

      res.json({
        success:true,
        message:`Base64 ${op} Completed Successfully`,
        data:result
      })

    }
    catch(error){
      next(error)
    }

  }

  static async urlTransform(req,res,next){
    try{
      const {input}=req.body;
      const {op}=req.params;

      const result=await TextTransformService.urlTransform(input,op);

      res.json({
        success:true,
        message:`URL ${op} Completed Successfully`,
        data:result
      })
    }
    catch(error){
      next(error)
    }
    
  }
  static async slugifyText(req,res,next){
    try{
      const {input}=req.body;
      const {separator='hyphen'}=req.params;

      const result=await TextTransformService.slugifyText(input,separator);

      res.json({
        success:true,
        message:`Text Slugified Successfully`,
        data:result
      })

    }
    catch(error){
      next(error)
    }
    
  }
  static async convertCase(req,res,next){
    try{
      const {input}=req.body;
      const {type}=req.params;

      const result=await TextTransformService.convertCase(input,type);

      res.json({
        success:true,
        message:`Case Conversion to ${type} Completed Successfully`,
        data:result
      })

    }
    catch(error){
      next(error)
    }
    
  }
  static async morseTransform(req,res,next){
    try{
      const {input}=req.body;
      const {op}=req.params;

      const result=await TextTransformService.morseTransform(input,op);

      res.json({
        success:true,
        message:`Morse ${op} completed successfully`,
        data:result
      })

    }
    catch(error){
      next(error);

    }
    
  }

}
*/
export default TextTransformController;