import { DateTime, IANAZone } from 'luxon';
import { getTimeZones } from '@vvo/tzdb';

export function getFeatureCodeRank(fcode) {
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


export function getTimeZoneMetadata(ianaId, referenceDate, foundBy) {
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
          dstNameLong: getTimeZoneLongName(ianaId)
        },
      };
    } catch (error) {
      throw new Error(`Error getting timezone metadata: ${error.message}`);
    }
  }


export function getTimeZoneLongName(ianaId) {
    try {
      const allTimeZones = getTimeZones();
      const zone = allTimeZones.find(tz => tz.name === ianaId);
      return zone ? zone.alternativeName : ianaId.replace('_', ' ');
    } catch (error) {
      return ianaId.replace('_', ' ');
    }
}
