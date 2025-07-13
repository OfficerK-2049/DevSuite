class TextTransformers {
  // Base64 operations
  static base64Encode(text) {
    try {
      return Buffer.from(text, 'utf8').toString('base64');
    } catch (error) {
      throw new Error('Failed to encode to base64');  //!error propagates up , utils -> services ->controllers -> errorMiddleware
    }
  }

  static base64Decode(text) {
    try {
      return Buffer.from(text, 'base64').toString('utf8');
    } catch (error) {
      throw new Error('Invalid base64 string');
    }
  }

  // URL encoding operations
  static urlEncode(text) {
    try {
      return encodeURIComponent(text);
    } catch (error) {
      throw new Error('Failed to URL encode');
    }
  }

  static urlDecode(text) {
    try {
      return decodeURIComponent(text);
    } catch (error) {
      throw new Error('Invalid URL encoded string');
    }
  }

  // Slugify operation
  static slugify(text, separator = 'hyphen') {
    const sep = separator === 'underscore' ? '_' : '-';
    
    return text
      .toString()
      .normalize('NFD') // Normalize unicode
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, '') // Remove special characters
      .replace(/\s+/g, sep) // Replace spaces with separator
      .replace(new RegExp(`${sep}+`, 'g'), sep) // Remove multiple separators
      .replace(new RegExp(`^${sep}|${sep}$`, 'g'), ''); // Remove leading/trailing separators
  }

  // Case conversion operations
  static convertCase(text, type) {
    switch (type) {
      case 'upper':
        return text.toUpperCase();
      
      case 'lower':
        return text.toLowerCase();
      
      case 'title':
        return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
      
      case 'camel':
        return text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (match, char) => char.toUpperCase());
      
      case 'pascal':
        return text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (match, char) => char.toUpperCase())
          .replace(/^(.)/, (match, char) => char.toUpperCase());
      
      case 'snake':
        return text
          .trim()
          .replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
          .replace(/[^a-zA-Z0-9]+/g, '_')
          .replace(/^_|_$/g, '')
          .replace(/_+/g, '_')
          .toLowerCase();
      
      case 'kebab':
        return text
          .trim()
          .replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
          .replace(/[^a-zA-Z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .replace(/-+/g, '-')
          .toLowerCase();
      
      default:
        throw new Error(`Invalid case type: ${type}`);
    }
  }

  // Morse code operations
  static getMorseCodeMap() {
    return {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
      'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
      'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
      'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
      'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
      '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
      '8': '---..', '9': '----.', ' ': '/'
    };
  }

  static getReverseMorseCodeMap() {
    const morseMap = this.getMorseCodeMap();  //??why use "this"?
    const reverseMap = {};
    for (const [key, value] of Object.entries(morseMap)) {
      reverseMap[value] = key;
    }
    return reverseMap;
  }

  static morseEncode(text) {
    const morseMap = this.getMorseCodeMap();   
    return text
      .toUpperCase()
      .split('')
      .map(char => morseMap[char] || char)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static morseDecode(text) {
    const reverseMorseMap = this.getReverseMorseCodeMap();
    return text
      .split(' ')
      .map(code => reverseMorseMap[code] || code)
      .join('')
      .replace(/\//g, ' ')
      .trim();
  }
}

export default TextTransformers;