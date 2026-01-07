// bot/intent-detector.js - Fuzzy Intent Detection
import stringSimilarity from 'string-similarity';

/**
 * Deteksi intent dari pesan user dengan fuzzy matching
 * Bisa deteksi typo, singkatan, dan variasi bahasa
 */

// Daftar kata untuk setiap intent
const INTENT_KEYWORDS = {
  cancel: [
    // Bahasa Indonesia
    'batal', 'batalkan', 'hentikan', 'keluar', 'stop',
    'gak jadi', 'ga jadi', 'tidak jadi', 'nggak jadi', 'ngga jadi',
    'gausah', 'ga usah', 'gak usah', 'tidak usah',
    'udah', 'sudah', 'cukup', 'selesai',
    // Singkatan/typo
    'btl', 'gkjd', 'gjd', 'tdk jadi', 'gk jd',
    // Bahasa Inggris
    'cancel', 'quit', 'exit', 'abort'
  ],
  
  continue: [
    // Bahasa Indonesia
    'lanjut', 'lanjutkan', 'lanjut daftar', 'mulai lagi',
    'oke', 'ok', 'okay', 'ya', 'yes', 'siap', 'baik',
    'gas', 'yuk', 'ayo', 'jalan',
    // Singkatan/typo
    'lnjt', 'lnjut', 'oks', 'ys', 'yoi',
    // Bahasa Inggris
    'continue', 'next', 'proceed', 'go'
  ],
  
  help: [
    'bantuan', 'help', 'tolong', 'info', 'menu',
    'gimana', 'gmn', 'gmana', 'bagaimana', 'cara'
  ]
};

/**
 * Hitung similarity score antara 2 string
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} Score 0-1
 */
function getSimilarity(str1, str2) {
  return stringSimilarity.compareTwoStrings(
    str1.toLowerCase().trim(),
    str2.toLowerCase().trim()
  );
}

/**
 * Deteksi intent dari pesan user
 * @param {string} text - Pesan user
 * @param {number} threshold - Minimum similarity score (default: 0.6)
 * @returns {Object} { intent: string, confidence: number, matchedKeyword: string }
 */
export function detectIntent(text, threshold = 0.6) {
  const lowerText = text.toLowerCase().trim();
  
  // Filter false positives - jangan deteksi jika text terlalu panjang atau format tertentu
  const isFalsePositive = 
    lowerText.length > 100 || // Text terlalu panjang
    lowerText.includes('@') || // Email
    lowerText.match(/^jl\.|^jalan/i) || // Alamat
    lowerText.match(/\d{10,}/) || // Nomor panjang
    lowerText.split(' ').length > 10; // Kalimat terlalu panjang
  
  if (isFalsePositive) {
    return { intent: null, confidence: 0, matchedKeyword: null };
  }
  
  // Cek exact match dulu (paling cepat)
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText === keyword || lowerText.includes(keyword)) {
        // Double check: jika keyword pendek (< 4 huruf), pastikan bukan bagian dari kata lain
        if (keyword.length < 4) {
          const words = lowerText.split(/\s+/);
          if (!words.includes(keyword)) {
            continue; // Skip jika keyword adalah bagian dari kata lain
          }
        }
        
        return {
          intent,
          confidence: 1.0,
          matchedKeyword: keyword,
          method: 'exact'
        };
      }
    }
  }
  
  // Jika tidak ada exact match, coba fuzzy matching
  let bestMatch = {
    intent: null,
    confidence: 0,
    matchedKeyword: null,
    method: 'fuzzy'
  };
  
  // Split text menjadi kata-kata
  const words = lowerText.split(/\s+/);
  
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      // Cek similarity dengan setiap kata
      for (const word of words) {
        const similarity = getSimilarity(word, keyword);
        
        if (similarity > bestMatch.confidence && similarity >= threshold) {
          bestMatch = {
            intent,
            confidence: similarity,
            matchedKeyword: keyword,
            method: 'fuzzy'
          };
        }
      }
      
      // Cek similarity dengan keseluruhan text (hanya jika text pendek)
      if (lowerText.length < 30) {
        const fullSimilarity = getSimilarity(lowerText, keyword);
        if (fullSimilarity > bestMatch.confidence && fullSimilarity >= threshold) {
          bestMatch = {
            intent,
            confidence: fullSimilarity,
            matchedKeyword: keyword,
            method: 'fuzzy'
          };
        }
      }
    }
  }
  
  return bestMatch.intent ? bestMatch : { intent: null, confidence: 0, matchedKeyword: null };
}

/**
 * Cek apakah user ingin membatalkan
 * @param {string} text 
 * @returns {boolean}
 */
export function isCancelIntent(text) {
  const result = detectIntent(text, 0.65); // Threshold lebih tinggi untuk cancel
  return result.intent === 'cancel';
}

/**
 * Cek apakah user ingin melanjutkan
 * @param {string} text 
 * @returns {boolean}
 */
export function isContinueIntent(text) {
  const result = detectIntent(text, 0.6);
  return result.intent === 'continue';
}

/**
 * Cek apakah user minta bantuan
 * @param {string} text 
 * @returns {boolean}
 */
export function isHelpIntent(text) {
  const result = detectIntent(text, 0.6);
  return result.intent === 'help';
}

/**
 * Test function untuk debugging
 */
export function testIntentDetection() {
  const testCases = [
    // Cancel
    'batal', 'btl', 'batalkan', 'gak jadi', 'gkjd', 'cancel', 'stop',
    'wah gak jadi deh', 'maaf batalkan', 'udah cukup',
    
    // Continue
    'lanjut', 'lnjt', 'oke', 'ok', 'gas', 'yuk', 'continue',
    'oke lanjut', 'yuk gas', 'siap lanjutkan',
    
    // Help
    'bantuan', 'help', 'gimana', 'gmn', 'tolong',
    
    // False positives (should not match)
    'Budi Batalkan', 'Jl. Lanjut No. 123', 'email@ok.com'
  ];
  
  console.log('=== INTENT DETECTION TEST ===\n');
  
  for (const text of testCases) {
    const result = detectIntent(text);
    console.log(`Text: "${text}"`);
    console.log(`Intent: ${result.intent || 'NONE'}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`Matched: ${result.matchedKeyword || '-'}`);
    console.log(`Method: ${result.method || '-'}`);
    console.log('---');
  }
}
