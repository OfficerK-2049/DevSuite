import Joi from 'joi';

export const ipSchema = Joi.string()
    .ip({
        version: ['ipv4', 'ipv6'],
        cidr: 'optional' // CIDR notation (e.g., /24) is optional
    })
    .messages({
        // Custom messages for clearer client feedback
        'string.ip': 'The provided IP address is malformed or invalid.',
        'any.required': 'IP address is required for this lookup type.'
    });


export function isPrivateIP(ip) {
    // Simple check for private/reserved IPs
    const privateRanges = [
      /^10\./,                    // 10.0.0.0 - 10.255.255.255
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0 - 172.31.255.255
      /^192\.168\./,              // 192.168.0.0 - 192.168.255.255
      /^127\./,                   // 127.0.0.0 - 127.255.255.255
      /^169\.254\./,              // 169.254.0.0 - 169.254.255.255
      /^::1$/,                    // localhost IPv6
      /^f[cd][0-9a-f]{2}:/i,      // unique local IPv6 unicast addresses
      /^fe80:/i                   // link-local IPv6 addresses
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

