// Test Groq dengan full scraping
import { loadKnowledgeBase, answerDenganGemini } from "./rag-groq.js";

console.log("🚀 Testing Groq dengan Full Scraping (semua halaman)...\n");

// Load knowledge base
await loadKnowledgeBase();

console.log("\n" + "=".repeat(60));
console.log("Testing Questions:");
console.log("=".repeat(60) + "\n");

// Test pertanyaan tentang ekstrakurikuler
const questions = [
  "Apa saja ekstrakurikuler yang tersedia?",
  "Kapan jadwal ekstrakurikuler Pramuka?",
  "Ada English Club tidak?"
];

for (const q of questions) {
  console.log(`\n❓ Pertanyaan: ${q}`);
  console.log("-".repeat(60));
  
  const answer = await answerDenganGemini(q);
  console.log(`💬 Jawaban:\n${answer}`);
  console.log("=".repeat(60));
  
  // Delay antar pertanyaan
  await new Promise(resolve => setTimeout(resolve, 1000));
}

console.log("\n✅ Test selesai!");
