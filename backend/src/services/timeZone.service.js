import { DateTime, IANAZone } from 'luxon';
import { find as geoTzFind } from 'geo-tz';
import { WebServiceClient } from '@maxmind/geoip2-node';
import axios from 'axios';
import { getTimeZones } from '@vvo/tzdb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { isPrivateIP } from '../utils/ipLookup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAXROWS=50;

// Load country code mapping
const countryMapping = {};
try {
  const countryData = fs.readFileSync(path.join(__dirname, '../utils/countryMapping.csv'), 'utf8');
  const lines = countryData.split('\n');
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 2) {
      countryMapping[parts[0].trim()] = parts[1].trim(); // Map country name to A2 code
    }
  }
} catch (error) {
  console.error('Error loading country mapping:', error);
}

// GeoNames API configuration
const GEONAMES_USERNAME = process.env.GEONAMES_USERNAME || 'demo';
const GEONAMES_API_URL = 'http://api.geonames.org/search';

// MaxMind configuration
const MAXMIND_ACCOUNT_ID = process.env.MAXMIND_ACCOUNT_ID;
const MAXMIND_LICENSE_KEY = process.env.MAXMIND_LICENSE_KEY;
const maxmindClient = MAXMIND_ACCOUNT_ID && MAXMIND_LICENSE_KEY ? 
  new WebServiceClient(MAXMIND_ACCOUNT_ID, MAXMIND_LICENSE_KEY,{
    host: 'geolite.info',
    timeout:10000,
  }) : null;
class TimeZoneService {
  static async getCurrentTime({ city, country, lat, lon, ip}) {
    try {
      // Priority: IP > lat/lon > city/country > city > country
      let ianaZoneId = null;
      let source = '';
      let warning = null;

      // 1.IP-based lookup
      if (ip && !ianaZoneId) {
        try {
          if (isPrivateIP(ip)) {
            warning='IP address is private/reserved and cannot be geolocated.';
            throw new Error('IP address is private/reserved and cannot be geolocated.');
          }
          
          if (maxmindClient) {
            const response = await maxmindClient.city(ip);
            if (response.location && response.location.timeZone) {
              ianaZoneId = response.location.timeZone;
              source = 'IP Geolocation (MaxMind)';
            }
          } else {
            throw new Error('MaxMind credentials not configured');
          }
        } catch (error) {
          console.error('IP lookup error:', error.message);
        }
      }

      // 2.coordinate-based lookup
      if (lat && lon && !ianaZoneId) {
        try {
          // Validate coordinates - Anything to float
          const latNum = parseFloat(lat);
          const lonNum = parseFloat(lon);
          
          if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
            throw new Error('Invalid coordinates');
          }
          
          const zones = geoTzFind(latNum, lonNum);
          if (zones && zones.length > 0) {
            ianaZoneId = zones[0]; //picking only the first IANAid
            source = 'Coordinate Lookup (geo-tz)';
          } else {
            // Handle unassigned areas (ocean)
            ianaZoneId = 'Etc/GMT';
            source = 'Coordinate Lookup (Default)';
            warning = 'Coordinates are in international waters; time zone defaulted to UTC (GMT+00:00).';
          }
        } catch (error) {
          console.error('Coordinate lookup error:', error.message);  //!why shouldn't these be thrown?
        }
      }

      // 3.city and country lookup
      if (city && country && !ianaZoneId) {
        try {
          const countryCode = this.getCountryCode(country);
          if (!countryCode) {
            throw new Error('Invalid country name');
          }
          
          const geonamesResponse = await axios.get(GEONAMES_API_URL, {
            params: {
              name_equals: city,
              country: countryCode,
              featureClass: 'P', // Populated places
              maxRows: MAXROWS,
              type:'json',
              style:'FULL', 
              username: GEONAMES_USERNAME
            }
          });
          
          if (geonamesResponse.data.totalResultsCount > 0) {
            // Apply scoring heuristic for city+country
            const results = geonamesResponse.data.geonames;
            const scoredResults = results.map(place => {
              // Calculate score based on population and feature code
              const fcodeRank = this.getFeatureCodeRank(place.fcode);
              const population = place.population || 0;
              const geonamesScore=place.score || 0;
              const score = (population * 0.6) + (fcodeRank * 0.3) + (geonamesScore*0.1); //heuristics
              return { ...place, score };
            });
            
            // Sort by score (descending)
            scoredResults.sort((a, b) => b.score - a.score);
            
            // Get timezone for the highest scored place
            const topPlace = scoredResults[0];
            ianaZoneId = topPlace.timezone.timezoneId;
            source = 'GeoNames API (City/Country Lookup)';
          }
        } catch (error) {
          console.error('City/country lookup error:', error.message);
        }
      }

      // 4. Try city-only lookup
      if (city && !ianaZoneId) {
        try {
          const geonamesResponse = await axios.get(GEONAMES_API_URL, {
            params: {
              name_equals: city,
              featureClass: 'P', // Populated places
              maxRows: MAXROWS,
              orderby: 'population',
              type:'json',
              style:'FULL', 
              username: GEONAMES_USERNAME
            }
          });
          
          if (geonamesResponse.data.totalResultsCount > 0) {
            // Get the most populated place
            const topPlace = geonamesResponse.data.geonames[0];
            ianaZoneId = topPlace.timezone.timezoneId;
            source = 'GeoNames API (City Lookup)';

          } else {
            throw new Error('City not found or is too small to be indexed.');
          }
        } catch (error) {
          console.error('City lookup error:', error.message);
        }
      }

      // 5. Try country-only lookup
      if (country && !ianaZoneId) {
        try {
          const countryCode = this.getCountryCode(country);
          if (!countryCode) {
            throw new Error('Invalid country name');
          }
          
          const geonamesResponse = await axios.get(GEONAMES_API_URL, {
            params: {
              country: countryCode,
              featureClass: 'P', // Populated places
              maxRows: MAXROWS,
              orderby: 'population',
              type:'json',
              style:'FULL', 
              username: GEONAMES_USERNAME
            }
          });
          
          if (geonamesResponse.data.totalResultsCount > 0) {

            const topPlace = geonamesResponse.data.geonames[0];
            ianaZoneId = topPlace.timezone.timezoneId;
            source = 'GeoNames API (Country Lookup)';
            
          }
        } catch (error) {
          console.error('Country lookup error:', error.message);
        }
      }

      // If no timezone found, default to UTC
      if (!ip && !ianaZoneId) {
        ianaZoneId = 'UTC';
        source = 'Default';
        warning = 'Could not determine timezone from provided parameters; defaulted to UTC.';
      }

      // Validate IANA ID
      const targetZone = IANAZone.create(ianaZoneId);
      if (!ip && !targetZone.isValid) {
        ianaZoneId = 'UTC';
        source = 'Default (Invalid IANA ID)';
        warning = 'Invalid IANA timezone ID; defaulted to UTC.';
      }

      // Get current UTC time
      const utcMoment = DateTime.utc();
      
      // Convert to target timezone
      const convertedTime = utcMoment.setZone(ianaZoneId);
      
      // Extract data for response
      const response = {
        status: 'success',
        data: {
          targetZone: {
            ianaId: convertedTime.zone.name,
            offsetMinutes: convertedTime.offset,
            offsetString: convertedTime.toFormat('ZZZZ'),
            abbreviation: convertedTime.offsetNameShort,
            longName: this.getTimeZoneLongName(convertedTime.zone.name),
            isDaylightSaving: convertedTime.isInDST,
            zoneType: 'iana'
          },
          time: {
            unixTimestampMs: convertedTime.toMillis(),
            utcIso: convertedTime.toUTC().toISO(),
            targetZoneIso: convertedTime.toISO(),
            targetZoneLocal: convertedTime.toLocaleString(DateTime.TIME_SIMPLE),
            targetZoneFull: convertedTime.toFormat('MMMM d, yyyy, h:mm a ') + convertedTime.offsetNameShort
          },
          meta: {
            source,
            inputDateTime: utcMoment.toISO()
          }
        }
      };

      // Add warning if present
      if (warning) {
        response.data.meta.warning = warning;
      }

      return response;
    } catch (error) {
      throw new Error(`Error getting current time: ${error.message}`);
    }
  }

  static async lookupTimeZone({ city, country, lat, lon, ip, referenceDate }) {
    try {
      const results = [];
      let foundBy = '';

      // 1. Try IP-based lookup
      if (ip) {
        try {
          // Validate IP is not private/reserved
          if (isPrivateIP(ip)) {
            throw new Error('IP address is private/reserved and cannot be geolocated.');
          }
          
          if (maxmindClient) {
            const response = await maxmindClient.city(ip);
            if (response.location && response.location.timeZone) {
              const ianaId = response.location.timeZone;
              results.push(await this.getTimeZoneMetadata(ianaId, referenceDate, 'IP Geolocation'));
              foundBy = 'IP Geolocation';
            }
          } else {
            // Fallback if MaxMind credentials not available
            throw new Error('MaxMind credentials not configured');
          }
        } catch (error) {
          console.error('IP lookup error:', error.message);
        }
      }

      // 2. Try coordinate-based lookup
      if (lat && lon && results.length === 0) {
        try {
          // Validate coordinates
          const latNum = parseFloat(lat);
          const lonNum = parseFloat(lon);
          
          if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
            throw new Error('Invalid coordinates');
          }
          
          const zones = geoTzFind(latNum, lonNum);
          if (zones && zones.length > 0) {
            const ianaId = zones[0];
            results.push(await this.getTimeZoneMetadata(ianaId, referenceDate, 'Coordinate Lookup'));
            foundBy = 'Coordinate Lookup';
          } else {
            // Handle unassigned areas (ocean)
            const ianaId = 'Etc/GMT';
            const metadata = await this.getTimeZoneMetadata(ianaId, referenceDate, 'Coordinate Lookup (Default)');
            metadata.warning = 'Coordinates are in international waters; time zone defaulted to UTC (GMT+00:00).';
            results.push(metadata);
            foundBy = 'Coordinate Lookup (Default)';
          }
        } catch (error) {
          console.error('Coordinate lookup error:', error.message);
        }
      }

      // 3. Try city and country lookup
      if (city && country && results.length === 0) {
        try {
          const countryCode = this.getCountryCode(country);
          if (!countryCode) {
            throw new Error('Invalid country name');
          }
          
          const geonamesResponse = await axios.get(GEONAMES_API_URL, {
            params: {
              name_equals: city,
              country: countryCode,
              featureClass: 'P', // Populated places
              maxRows: 10,
              username: GEONAMES_USERNAME
            }
          });
          
          if (geonamesResponse.data.totalResultsCount > 0) {
            // Apply scoring heuristic for city+country
            const geoResults = geonamesResponse.data.geonames;
            const scoredResults = geoResults.map(place => {
              // Calculate score based on population and feature code
              const fcodeRank = this.getFeatureCodeRank(place.fcode);
              const population = place.population || 0;
              const score = (population * 0.6) + (fcodeRank * 0.4);
              return { ...place, score };
            });
            
            // Sort by score (descending)
            scoredResults.sort((a, b) => b.score - a.score);
            
            // Get timezone for the highest scored place
            const topPlace = scoredResults[0];
            const tzResponse = await axios.get(`http://api.geonames.org/timezoneJSON`, {
              params: {
                lat: topPlace.lat,
                lng: topPlace.lng,
                username: GEONAMES_USERNAME
              }
            });
            
            if (tzResponse.data && tzResponse.data.timezoneId) {
              const ianaId = tzResponse.data.timezoneId;
              results.push(await this.getTimeZoneMetadata(ianaId, referenceDate, 'City + Country Lookup (Highest Population)'));
              foundBy = 'City + Country Lookup (Highest Population)';
            }
          }
        } catch (error) {
          console.error('City/country lookup error:', error.message);
        }
      }

      // 4. Try city-only lookup
      if (city && results.length === 0) {
        try {
          const geonamesResponse = await axios.get(GEONAMES_API_URL, {
            params: {
              name_equals: city,
              featureClass: 'P', // Populated places
              maxRows: 10,
              orderby: 'population',
              username: GEONAMES_USERNAME
            }
          });
          
          if (geonamesResponse.data.totalResultsCount > 0) {
            // Get the most populated place
            const topPlace = geonamesResponse.data.geonames[0];
            
            const tzResponse = await axios.get(`http://api.geonames.org/timezoneJSON`, {
              params: {
                lat: topPlace.lat,
                lng: topPlace.lng,
                username: GEONAMES_USERNAME
              }
            });
            
            if (tzResponse.data && tzResponse.data.timezoneId) {
              const ianaId = tzResponse.data.timezoneId;
              results.push(await this.getTimeZoneMetadata(ianaId, referenceDate, 'City Lookup (Highest Population)'));
              foundBy = 'City Lookup (Highest Population)';
            }
          } else {
            throw new Error('City not found or is too small to be indexed.');
          }
        } catch (error) {
          console.error('City lookup error:', error.message);
        }
      }

      // 5. Try country-only lookup
      if (country && results.length === 0) {
        try {
          const countryCode = this.getCountryCode(country);
          if (!countryCode) {
            throw new Error('Invalid country name');
          }
          
          // For country-only, use @vvo/tzdb to get up to 5 unique IANA IDs
          const allTimeZones = getTimeZones();
          const countryTimeZones = allTimeZones.filter(tz => tz.countryCode === countryCode);
          
          // Get unique IANA IDs
          const uniqueZones = new Set();
          const uniqueZoneObjects = [];
          
          for (const tz of countryTimeZones) {
            if (!uniqueZones.has(tz.name) && uniqueZones.size < 5) {
              uniqueZones.add(tz.name);
              uniqueZoneObjects.push(tz);
            }
          }
          
          // Get metadata for each unique zone
          for (const tz of uniqueZoneObjects) {
            const metadata = await this.getTimeZoneMetadata(tz.name, referenceDate, 'Country Lookup');
            results.push(metadata);
          }
          
          foundBy = 'Country Lookup (Multiple Time Zones)';
        } catch (error) {
          console.error('Country lookup error:', error.message);
        }
      }

      // If no results, return error
      if (results.length === 0) {
        throw new Error('Could not determine timezone from provided parameters');
      }

      return {
        status: 'success',
        queryTime: new Date().toISOString(),
        requestedReferenceDate: referenceDate,
        results
      };
    } catch (error) {
      throw new Error(`Error looking up timezone: ${error.message}`);
    }
  }


  static async getTimeZoneMetadata(ianaId, referenceDate, foundBy) {
    try {
      // Validate IANA ID
      const targetZone = IANAZone.create(ianaId);
      if (!targetZone.isValid) {
        throw new Error('Invalid IANA timezone ID');
      }

      // Create DateTime object for the reference date at noon (to avoid DST transition issues)
      const refDate = DateTime.fromISO(`${referenceDate}T12:00:00`, { zone: ianaId });
      
      return {
        ianaId,
        foundBy,
        metadataAtDate: {
          date: referenceDate,
          utcOffsetMinutes: refDate.offset,
          offsetString: refDate.toFormat('ZZZZ'),
          abbreviation: refDate.offsetNameShort,
          isCurrentlyDST: refDate.isInDST,
          dstNameLong: this.getTimeZoneLongName(ianaId)
        }
      };
    } catch (error) {
      throw new Error(`Error getting timezone metadata: ${error.message}`);
    }
  }


  static getCountryCode(countryName) {
    return countryMapping[countryName] || null;  // ISO 3166-1 alpha-2 country code
  }


  static getFeatureCodeRank(fcode) {
    const fcodeRanks = {
      'PPLC': 100, // Capital
      'PPLA': 80,  // Administrative division
      'PPLA2': 70,
      'PPLA3': 60,
      'PPLA4': 50,
      'PPL': 40,   // Populated place
      'PPLX': 30   // Section of populated place
    };
    
    return fcodeRanks[fcode] || 0;
  }

  static getTimeZoneLongName(ianaId) {
    try {
      const allTimeZones = getTimeZones();
      const zone = allTimeZones.find(tz => tz.name === ianaId);
      return zone ? zone.alternativeName : ianaId.replace('_', ' ');
    } catch (error) {
      return ianaId.replace('_', ' ');
    }
  }

}

export default TimeZoneService;