import { DateTime, IANAZone } from 'luxon';
import { find as geoTzFind } from 'geo-tz';
import { WebServiceClient } from '@maxmind/geoip2-node';
import axios from 'axios';
import { getTimeZones } from '@vvo/tzdb';


import { isPrivateIP } from '../utils/ipUtils.js';
import { getCountryCode } from '../utils/countryCodeMapper.js';
import { getFeatureCodeRank } from '../utils/timeUtils.js';
import { getTimeZoneMetadata,getTimeZoneLongName } from '../utils/timeUtils.js';
import { serializeParams } from '../utils/serialize.js';
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
              featureClass:['P','A'],
              maxRows: MAXROWS,
              type:'json',
              style:'FULL', 
              username: GEONAMES_USERNAME
            },
            paramsSerializer: serializeParams
          }
        );
          
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
              featureClass:['P','A'],
              maxRows: MAXROWS,
              orderby: 'population',
              type:'json',
              style:'FULL', 
              username: GEONAMES_USERNAME
            },
            paramsSerializer: serializeParams
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
              featureClass:['P','A'],
              maxRows: MAXROWS,
              orderby: 'population',
              type:'json',
              style:'FULL', 
              username: GEONAMES_USERNAME
            },
            paramsSerializer: serializeParams
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
            longName: getTimeZoneLongName(convertedTime.zone.name),
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
            warning='IP address is private/reserved and cannot be geolocated.';
            throw new Error('IP address is private/reserved and cannot be geolocated.');
          }
          
          if (maxmindClient) {
            const response = await maxmindClient.city(ip);
            if (response.location && response.location.timeZone) {
              const ianaId = response.location.timeZone;
              results.push(await getTimeZoneMetadata(ianaId, referenceDate, 'IP Geolocation'));
              foundBy = 'IP Geolocation';
            }
          } else {
            throw new Error('MaxMind credentials not configured');
          }
        } catch (error) {
          console.error('IP lookup error:', error.message);
        }
      }

      // 2.coordinate-based lookup
      if (lat && lon && results.length === 0) {
        try {
          const latNum = parseFloat(lat);
          const lonNum = parseFloat(lon);
          
          if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
            warning='Invalid coordinates';
            throw new Error('Invalid coordinates');
          }
          
          const zones = geoTzFind(latNum, lonNum);
          if (zones && zones.length > 0) {
            const ianaIds = zones;
            for(const ianaId of ianaIds)
            {
              const metadata = await getTimeZoneMetadata(ianaId, referenceDate, 'Coordinate Lookup');
              results.push(metadata);
            }
            foundBy = 'Coordinate Lookup';
          } else {
            // Handle unassigned areas (ocean)
            const ianaId = 'Etc/GMT';
            const metadata = await getTimeZoneMetadata(ianaId, referenceDate, 'Coordinate Lookup (Default)');
            warning = 'Coordinates are in international waters; time zone defaulted to UTC (GMT+00:00).';
            results.push(metadata);
            foundBy = 'Coordinate Lookup (Default)';
          }
        } catch (error) {
          console.error('Coordinate lookup error:', error.message);
        }
      }

      // 3. Try city and country lookup
      if (city && country && results.length === 0) {
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
              featureClass:['P','A'],
              maxRows: MAXROWS,
              type:'json',
              style:'FULL', 
              username: GEONAMES_USERNAME
            },
            paramsSerializer: serializeParams
          });
          
          if (geonamesResponse.data.totalResultsCount > 0) {

            const geoResults = geonamesResponse.data.geonames;
            const scoredResults = geoResults.map(place => {
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
            results.push(await getTimeZoneMetadata(ianaId, referenceDate, 'City + Country Lookup (Highest Population)'));
            foundBy = 'City + Country Lookup (Highest Population)';

          }
        } catch (error) {
          console.error('City/country lookup error:', error.message);
        }
      }
      // 4.city-only lookup
      if (city && results.length === 0) {
        city=city.replace(/-/g, ' '); 
        try {
          const geonamesResponse = await axios.get(GEONAMES_API_URL, {
            params: {
              name_equals: city,
              featureClass:['P','A'], // Populated places, Administrative places
              maxRows: MAXROWS,
              orderby: 'population',
              type:'json',
              style:'FULL', 
              username: GEONAMES_USERNAME
            },
            paramsSerializer: serializeParams
          });
          
          if (geonamesResponse.data.totalResultsCount > 0) {
            // Get the most populated place
            const topPlace = geonamesResponse.data.geonames[0];
            const ianaId = topPlace.timezone.timeZoneId;
            results.push(await getTimeZoneMetadata(ianaId, referenceDate, 'City Lookup (Highest Population)'));
            foundBy = 'City Lookup (Highest Population)';

          } else {
            warning='City not found or is too small to be indexed.';
            throw new Error('City not found or is too small to be indexed.');
          }
        } catch (error) {
          console.error('City lookup error:', error.message);
        }
      }

      // 5.country-only lookup
      if (country && results.length === 0) {
        country=country.replace(/-/g, ' '); 
        try {
          const countryCode = getCountryCode(country);
          if (!countryCode) {
            warning='Invalid country name';
            throw new Error('Invalid country name');
          }
          
          const allTimeZones = getTimeZones();
          const countryTimeZones = allTimeZones.filter(tz => tz.countryCode === countryCode);
          
          const uniqueZones = new Set();
          const uniqueZoneObjects = [];
          
          for (const tz of countryTimeZones) {
            if (!uniqueZones.has(tz.name)) {
              uniqueZones.add(tz.name);
              uniqueZoneObjects.push(tz);
            }
          }
          
          // Get metadata for each unique zone
          for (const tz of uniqueZoneObjects) {
            console.log("Am I running?")
            const metadata = await getTimeZoneMetadata(tz.name, referenceDate, 'Country Lookup',warning);
            console.log("Meta : ",metadata)
            results.push(metadata);
          }
          console.log("Final : ",results)
          
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
        results,
        warning
      };
    } catch (error) {
      throw new Error(`Error looking up timezone: ${error.message}`);
    }
  }

  static async convertTime({ dateTime, fromZone, toZone }) {
  const warnings = [];
  const audit = {
    sourceInput: dateTime,
    inputInterpretation: ''
  };
 //handle encoding for + offset
  dateTime = dateTime.replace(/ (\d{2}:\d{2})$/, '+$1');
  // Check if dateTime has explicit offset
  const offsetRegex = /[+-]\d{2}:\d{2}|Z$/;
  const hasExplicitOffset = offsetRegex.test(dateTime);

  let parsedDateTime;
  let sourceZoneUsed = null;

  // State determination logic
  if (hasExplicitOffset && fromZone) {
    // State A: Has offset + fromZone provided -> Ignore fromZone
    warnings.push('fromZone was provided but ignored because the DateTime string included an explicit offset.');
    parsedDateTime = DateTime.fromISO(dateTime,{strict:false});
    console.log("DId I enter Parsed0? : ",parsedDateTime)
    audit.inputInterpretation = `Offset provided in string was used to define the moment (UTC: ${parsedDateTime.toUTC().toISO()}).`;
  } else if (hasExplicitOffset && !fromZone) {
    // State B: Has offset, no fromZone -> Use offset
    parsedDateTime = DateTime.fromISO(dateTime);
    audit.inputInterpretation = `Offset in DateTime string was used to define the moment.`;
  } else if (!hasExplicitOffset && fromZone) {
    // State C: No offset + fromZone -> Interpret as floating time in fromZone
    parsedDateTime = DateTime.fromISO(dateTime, { zone: fromZone });
    sourceZoneUsed = fromZone;
    audit.inputInterpretation = `Floating time interpreted as originating in ${fromZone}.`;
  } else {
    // State D: No offset, no fromZone -> ERROR
    throw {
      statusCode: 400,
      message: 'Ambiguous input: dateTime lacks an offset and fromZone was not provided. Cannot determine the moment in time.',
      code: 'AMBIGUOUS_DATETIME'
    };
  }
    // Validate input DateTime
    if (!parsedDateTime.isValid) {
      console.log("Parsed : ",parsedDateTime)
    throw {
      statusCode: 400,
      message: `Malformed dateTime: ${parsedDateTime.invalidReason}`,
      code: 'INVALID_DATETIME'
    };
  }

  // Check if time component exists
  const hasTimeComponent = /T\d/.test(dateTime);
  if (!hasTimeComponent) {
    warnings.push('No time component detected in dateTime. Defaulted to midnight (00:00:00).');
  }

  // DST ambiguity check (only for State C with fromZone)
  if (sourceZoneUsed) { 
    // This check determines if the local wall time was ambiguous or skipped.
    const possibleOffsets = parsedDateTime.getPossibleOffsets(); 
    
    if (possibleOffsets.length > 1) {
        warnings.push(`Ambiguous time detected in ${sourceZoneUsed}. The local wall time occurred twice during a DST fall-back. The first instance was selected.`);
    } 
    // The most reliable check for "skipped time" is comparing the input string's time against the time Luxon resolved.
    const inputTimePart = dateTime.split('T')[1]?.substring(0, 5) || '00:00'; // e.g., '14:30'
    const resolvedTimePart = parsedDateTime.toFormat('HH:mm');

    if (possibleOffsets.length === 0 || (possibleOffsets.length === 1 && inputTimePart !== resolvedTimePart)) {
        warnings.push(`Invalid time detected (DST spring forward). Luxon adjusted the time from ${inputTimePart} to ${resolvedTimePart} to find the nearest valid moment.`);
    }
}

  // Convert to target zone
  const convertedDateTime = parsedDateTime.setZone(toZone);

  return {
    status: 'success',
    conversion: {
      targetZone: toZone,
      sourceZoneUsed: sourceZoneUsed,
      utcTime: {
        iso: parsedDateTime.toUTC().toISO(),
        unixTimestampMs: parsedDateTime.toMillis()
      },
      result: {
        iso: convertedDateTime.toISO(),
        localWallTime: convertedDateTime.toFormat('hh:mm a'),
        fullFormat: convertedDateTime.toFormat('MMMM d, yyyy \'at\' h:mm a ZZZZ'),
        metadata: {
          offsetMinutes: convertedDateTime.offset,
          offsetString: convertedDateTime.toFormat('ZZ'),
          abbreviation: convertedDateTime.offsetNameShort,
          isDaylightSaving: convertedDateTime.isInDST
        }
      }
    },
    warnings,
    audit
  };
  }

  static async formatTime({ dateTime, displayZone, format, locale }) {
  // Luxon predefined format constants map
  const LUXON_FORMAT_CONSTANTS = {
    'DATE_SHORT': DateTime.DATE_SHORT,
    'DATE_MED': DateTime.DATE_MED,
    'DATE_MED_WITH_WEEKDAY': DateTime.DATE_MED_WITH_WEEKDAY,
    'DATE_FULL': DateTime.DATE_FULL,
    'DATE_HUGE': DateTime.DATE_HUGE,
    'TIME_SIMPLE': DateTime.TIME_SIMPLE,
    'TIME_WITH_SECONDS': DateTime.TIME_WITH_SECONDS,
    'TIME_WITH_SHORT_OFFSET': DateTime.TIME_WITH_SHORT_OFFSET,
    'TIME_WITH_LONG_OFFSET': DateTime.TIME_WITH_LONG_OFFSET,
    'TIME_24_SIMPLE': DateTime.TIME_24_SIMPLE,
    'TIME_24_WITH_SECONDS': DateTime.TIME_24_WITH_SECONDS,
    'TIME_24_WITH_SHORT_OFFSET': DateTime.TIME_24_WITH_SHORT_OFFSET,
    'TIME_24_WITH_LONG_OFFSET': DateTime.TIME_24_WITH_LONG_OFFSET,
    'DATETIME_SHORT': DateTime.DATETIME_SHORT,
    'DATETIME_MED': DateTime.DATETIME_MED,
    'DATETIME_FULL': DateTime.DATETIME_FULL,
    'DATETIME_HUGE': DateTime.DATETIME_HUGE,
    'DATETIME_SHORT_WITH_SECONDS': DateTime.DATETIME_SHORT_WITH_SECONDS,
    'DATETIME_MED_WITH_SECONDS': DateTime.DATETIME_MED_WITH_SECONDS,
    'DATETIME_MED_WITH_WEEKDAY': DateTime.DATETIME_MED_WITH_WEEKDAY,
    'DATETIME_FULL_WITH_SECONDS': DateTime.DATETIME_FULL_WITH_SECONDS,
    'DATETIME_HUGE_WITH_SECONDS': DateTime.DATETIME_HUGE_WITH_SECONDS
  };

  dateTime = dateTime.replace(/ (\d{2}:\d{2})$/, '+$1');

  format=format.replace(/-/g, ' ');

  let parsedDateTime = DateTime.fromISO(dateTime);

  // If no offset in dateTime, use displayZone for interpretation
  const offsetRegex = /[+-]\d{2}:\d{2}|Z$/;
  if (!offsetRegex.test(dateTime)) {
    parsedDateTime = DateTime.fromISO(dateTime, { zone: displayZone });
  } else {
    // Has offset, convert to displayZone
    parsedDateTime = parsedDateTime.setZone(displayZone);
  }

  if (!parsedDateTime.isValid) {
    throw {
      statusCode: 400,
      message: `Malformed dateTime: ${parsedDateTime.invalidReason}`,
      code: 'INVALID_DATETIME'
    };
  }

  if (locale) {
    parsedDateTime = parsedDateTime.setLocale(locale);
  }

  let formattedTime;
  let requestedFormat = format;

  try {
    if (LUXON_FORMAT_CONSTANTS[format]) {
      formattedTime = parsedDateTime.toLocaleString(LUXON_FORMAT_CONSTANTS[format]);
    } else {
      formattedTime = parsedDateTime.toFormat(format);
    }
  } catch (error) {
    throw {
      statusCode: 400,
      message: `Invalid format string: ${error.message}`,
      code: 'INVALID_FORMAT'
    };
  }

  return {
    status: 'success',
    data: {
      formattedTime,
      requestedFormat,
      metadata: {
        ianaZoneId: parsedDateTime.zoneName,
        appliedLocale: locale || 'en-US',
        unixTimestampMs: parsedDateTime.toMillis(),
        inputTimeParsed: parsedDateTime.toISO()
      }
    }
  };
  }


}



export default TimeZoneService;