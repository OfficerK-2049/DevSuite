import TextTransformers from "../utils/textTransformers.js";
import logger from "../utils/logger.js";

class TextTransformService {
  static async base64Transform(input, operation) {
    try {
      let result;
      
      if (operation === 'encode') {
        result = TextTransformers.base64Encode(input);
      } else if (operation === 'decode') {
        result = TextTransformers.base64Decode(input);
      } else {
        throw new Error('Invalid operation');
      }

      logger.info(`Base64 ${operation} operation completed`);
      return { result, operation };
    } catch (error) {
      logger.error(`Base64 ${operation} error:`, error.message);
      throw error;
    }
  }

  static async urlTransform(input, operation) {
    try {
      let result;
      
      if (operation === 'encode') {
        result = TextTransformers.urlEncode(input);
      } else if (operation === 'decode') {
        result = TextTransformers.urlDecode(input);
      } else {
        throw new Error('Invalid operation');
      }

      logger.info(`URL ${operation} operation completed`);
      return { result, operation };
    } catch (error) {
      logger.error(`URL ${operation} error:`, error.message);
      throw error;
    }
  }

  static async slugifyText(input, separator = 'hyphen') {
    try {
      const result = TextTransformers.slugify(input, separator);
      
      logger.info(`Slugify operation completed with separator: ${separator}`);
      return { result, separator };
    } catch (error) {
      logger.error('Slugify error:', error.message);
      throw error;
    }
  }

  static async convertCase(input, type) {
    try {
      const result = TextTransformers.convertCase(input, type);
      
      logger.info(`Case conversion to ${type} completed`);
      return { result, type };
    } catch (error) {
      logger.error(`Case conversion error:`, error.message);
      throw error;
    }
  }

  static async morseTransform(input, operation) {
    try {
      let result;
      
      if (operation === 'encode') {
        result = TextTransformers.morseEncode(input);
      } else if (operation === 'decode') {
        result = TextTransformers.morseDecode(input);
      } else {
        throw new Error('Invalid operation');
      }

      logger.info(`Morse ${operation} operation completed`);
      return { result, operation };
    } catch (error) {
      logger.error(`Morse ${operation} error:`, error.message);
      throw error;
    }
  }
}

export default TextTransformService;