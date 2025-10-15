import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Load country code mapping
const countryMapping = {};
try {
  const countryData = fs.readFileSync(path.join(__dirname, '../../data/countryMapping.csv'), 'utf8');
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


export function getCountryCode(countryName) {
    return countryMapping[countryName] || null;  // ISO 3166-1 alpha-2 country code
  }