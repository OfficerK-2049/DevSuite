import { DateTime, IANAZone } from 'luxon';
import { find as geoTzFind } from 'geo-tz';
import { WebServiceClient } from '@maxmind/geoip2-node';
import axios from 'axios';
import { getTimeZones } from '@vvo/tzdb';

import { isPrivateIP } from '../utils/ipLookup.js';
import { getCountryCode } from '../utils/countryCodeMapper.js';
import { getFeatureCodeRank } from '../utils/timeHeuristics.js';

const MAXROWS=30;

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

     //!wtf is the use of ianaId in conditional?
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
            warning='Invalid coordinates';
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
        city=city.replace(/-/g, ' ');
        country=country.replace(/-/g, ' ');
        try {
          const countryCode = getCountryCode(country);
          if (!countryCode) {
            warning='Invalid country name';
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
              const fcodeRank = getFeatureCodeRank(place.fcode);
              const population = place.population || 0;
              const geonamesScore=place.score || 0;
              const score = (population * 0.6) + (fcodeRank * 0.3) + (geonamesScore*0.1); //heuristics
              return { ...place, score };
            });
            
            // Sort by score (descending)
            scoredResults.sort((a, b) => b.score - a.score);
            
            // Get timezone for the highest scored place
            const topPlace = scoredResults[0];
            ianaZoneId = topPlace.timezone.timeZoneId;
            source = 'GeoNames API (City/Country Lookup)';
          }
        } catch (error) {
          console.error('City/country lookup error:', error.message);
        }
      }

      // 4. Try city-only lookup
      if (city && !ianaZoneId) {
        city=city.replace(/-/g, ' ');  //handle spaced params
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
            
            ianaZoneId = topPlace.timezone.timeZoneId;
            source = 'GeoNames API (City Lookup)';

          } else {
            warning='City not found or is too small to be indexed.'
            throw new Error('City not found or is too small to be indexed.');
          }
        } catch (error) {
          console.error('City lookup error:', error.message);
        }
      }

      // 5. Try country-only lookup
      if (country && !ianaZoneId) {
        country=country.replace(/-/g, ' ');
        try {
          const countryCode = getCountryCode(country);
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
            ianaZoneId = topPlace.timezone.timeZoneId;
            source = 'GeoNames API (Country Lookup)';
            
          }
        } catch (error) {
          console.error('Country lookup error:', error.message);
        }
      }

      // If no timezone found, default to UTC
      if (!ianaZoneId) {
        ianaZoneId = 'UTC';
        source = 'Default';
        if(!warning){
          warning = 'Could not determine timezone from provided parameters; defaulted to UTC.';
        }
      }

      // Validate IANA ID
      const targetZone = IANAZone.create(ianaZoneId);
      if (!targetZone.isValid) {
        ianaZoneId = 'UTC';
        source = 'Default (Invalid IANA ID)';
        if(!warning){
          warning = 'Invalid IANA timezone ID; defaulted to UTC.';
        }
        
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
      let warning=''

      // 1.IP-based lookup
      if (ip) {
        try {
          // Validate IP is not private/reserved
          if (isPrivateIP(ip)) {
            //TODO : no warning set
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
            //TODO : no warnings
            throw new Error('Invalid coordinates');
          }
          
          const zones = geoTzFind(latNum, lonNum);
          if (zones && zones.length > 0) {
            const ianaIds = zones;
            //TODO : no warnings - time zone metadata defaults to the first zone
            for(const ianaId of ianaIds)
            {
              const metadata = await this.getTimeZoneMetadata(ianaId, referenceDate, 'Coordinate Lookup');
              results.push(metadata);
            }
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
          const countryCode = getCountryCode(country);
          if (!countryCode) {
            //TODO : no warnings
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
            const geoResults = geonamesResponse.data.geonames;
            const scoredResults = geoResults.map(place => {
              // Calculate score based on population and feature code
              const fcodeRank = getFeatureCodeRank(place.fcode);
              const population = place.population || 0;
              const geonamesScore=place.score || 0;
              const score = (population * 0.6) + (fcodeRank * 0.3) + (geonamesScore*0.1); //heuristics
              return { ...place, score };
            });
            
            // Sort by score (descending)
            scoredResults.sort((a, b) => b.score - a.score);
            
            // Get timezone for the highest scored place
            const topPlace = scoredResults[0];
            const ianaId = topPlace.timezone.timeZoneId;
            results.push(await this.getTimeZoneMetadata(ianaId, referenceDate, 'City + Country Lookup (Highest Population)'));
            foundBy = 'City + Country Lookup (Highest Population)';

          }
        } catch (error) {
          console.error('City/country lookup error:', error.message);
        }
      }
      // 4. Try city-only lookup
      if (city && results.length === 0) {
        city=city.replace(/-/g, ' '); 
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
            const ianaId = topPlace.timezone.timeZoneId;
            results.push(await this.getTimeZoneMetadata(ianaId, referenceDate, 'City Lookup (Highest Population)'));
            foundBy = 'City Lookup (Highest Population)';

          } else {
            warning='City not found or is too small to be indexed.';
            throw new Error('City not found or is too small to be indexed.');
          }
        } catch (error) {
          console.error('City lookup error:', error.message);
        }
      }

      // 5. Try country-only lookup
      if (country && results.length === 0) {
        try {
          const countryCode = getCountryCode(country);
          if (!countryCode) {
            //TODO : no warnings
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
        //!I guess there's no point in returning any other data
        return{
          success:'false',
          message:'Could not determine timezone from provided parameters',
          warning
        }
        // throw new Error('Could not determine timezone from provided parameters'); !do NOT throw explicit errors in fina try-catch unless you want to expose it to the user
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
        //TODO : no warnings
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
        },
        warning
      };
    } catch (error) {
      throw new Error(`Error getting timezone metadata: ${error.message}`);
    }
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