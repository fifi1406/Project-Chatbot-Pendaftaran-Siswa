import stringSimilarity from "string-similarity";

export const intents = {
  "cara_daftar": [
    "bagaimana cara daftar",
    "cara daftar",
    "daftar gimana",
    "gimana daftar"
  ],
  "syarat": [
    "apa syaratnya",
    "syarat daftar",
    "syarat pendaftaran"
  ],
  "mulai_daftar": [
    "saya mau daftar",
    "ingin daftar",
    "mau daftar sekarang"
  ]
};

export function getIntent(text) {
  let bestScore = 0;
  let bestIntent = null;

  for (const intent in intents) {
    const match = stringSimilarity.findBestMatch(text, intents[intent]);
    if (match.bestMatch.rating > bestScore) {
      bestScore = match.bestMatch.rating;
      bestIntent = intent;
    }
  }

  return bestScore > 0.4 ? bestIntent : null;
}
