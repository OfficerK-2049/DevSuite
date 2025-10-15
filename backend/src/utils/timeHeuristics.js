
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