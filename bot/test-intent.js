// Test fuzzy intent detection
import { detectIntent, isCancelIntent, isContinueIntent, isHelpIntent } from "./intent-detector.js";

console.log('🧪 TESTING FUZZY INTENT DETECTION\n');
console.log('='.repeat(60));

const testCases = [
  // ===== CANCEL INTENT =====
  { text: 'batal', expected: 'cancel' },
  { text: 'btl', expected: 'cancel' },
  { text: 'batalkan', expected: 'cancel' },
  { text: 'gak jadi', expected: 'cancel' },
  { text: 'gkjd', expected: 'cancel' },
  { text: 'gjd', expected: 'cancel' },
  { text: 'cancel', expected: 'cancel' },
  { text: 'stop', expected: 'cancel' },
  { text: 'wah gak jadi deh', expected: 'cancel' },
  { text: 'maaf batalkan ya', expected: 'cancel' },
  { text: 'udah cukup', expected: 'cancel' },
  { text: 'ga usah', expected: 'cancel' },
  
  // ===== CONTINUE INTENT =====
  { text: 'lanjut', expected: 'continue' },
  { text: 'lnjt', expected: 'continue' },
  { text: 'lnjut', expected: 'continue' },
  { text: 'oke', expected: 'continue' },
  { text: 'ok', expected: 'continue' },
  { text: 'oks', expected: 'continue' },
  { text: 'gas', expected: 'continue' },
  { text: 'yuk', expected: 'continue' },
  { text: 'ayo', expected: 'continue' },
  { text: 'continue', expected: 'continue' },
  { text: 'oke lanjut', expected: 'continue' },
  { text: 'yuk gas', expected: 'continue' },
  { text: 'siap lanjutkan', expected: 'continue' },
  
  // ===== HELP INTENT =====
  { text: 'bantuan', expected: 'help' },
  { text: 'help', expected: 'help' },
  { text: 'gimana', expected: 'help' },
  { text: 'gmn', expected: 'help' },
  { text: 'tolong', expected: 'help' },
  { text: 'info', expected: 'help' },
  
  // ===== FALSE POSITIVES (should NOT match) =====
  { text: 'Budi Batalkan', expected: null, note: 'Nama orang' },
  { text: 'Jl. Lanjut No. 123', expected: null, note: 'Alamat' },
  { text: 'email@ok.com', expected: null, note: 'Email' },
  { text: 'Jakarta', expected: null, note: 'Kota' },
  { text: 'Islam', expected: null, note: 'Agama' },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = detectIntent(testCase.text);
  const isMatch = result.intent === testCase.expected;
  
  if (isMatch) {
    passed++;
    console.log(`✅ PASS: "${testCase.text}"`);
  } else {
    failed++;
    console.log(`❌ FAIL: "${testCase.text}"`);
    console.log(`   Expected: ${testCase.expected || 'null'}`);
    console.log(`   Got: ${result.intent || 'null'}`);
    if (testCase.note) console.log(`   Note: ${testCase.note}`);
  }
  
  if (result.intent) {
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`   Matched: "${result.matchedKeyword}"`);
    console.log(`   Method: ${result.method}`);
  }
  console.log('');
}

console.log('='.repeat(60));
console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed`);
console.log(`Success rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);

// Test helper functions
console.log('='.repeat(60));
console.log('Testing helper functions:\n');

const helperTests = [
  { text: 'btl', func: isCancelIntent, expected: true, name: 'isCancelIntent' },
  { text: 'lnjt', func: isContinueIntent, expected: true, name: 'isContinueIntent' },
  { text: 'gmn', func: isHelpIntent, expected: true, name: 'isHelpIntent' },
  { text: 'Jakarta', func: isCancelIntent, expected: false, name: 'isCancelIntent (false)' },
];

for (const test of helperTests) {
  const result = test.func(test.text);
  const isMatch = result === test.expected;
  
  console.log(`${isMatch ? '✅' : '❌'} ${test.name}("${test.text}") = ${result} (expected: ${test.expected})`);
}

console.log('\n✅ Test selesai!');
