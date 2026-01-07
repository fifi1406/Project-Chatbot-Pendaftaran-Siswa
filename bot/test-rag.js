// Test RAG system
import { loadKnowledgeBase, answerDenganGemini } from "./rag.js";

console.log("🚀 Testing RAG System...\n");

// Load knowledge base
await loadKnowledgeBase();

console.log("\n" + "=".repeat(60));
console.log("Testing Questions:");
console.log("=".repeat(60) + "\n");

// Test pertanyaan
const questions = [
  "Berapa biaya pendaftaran?",
  "Apa saja syarat pendaftaran?",
  "Kapan pendaftaran dibuka?"
];

for (const q of questions) {
  console.log(`\n❓ Pertanyaan: ${q}`);
  console.log("-".repeat(60));
  
  const answer = await answerDenganGemini(q);
  console.log(`💬 Jawaban:\n${answer}`);
  console.log("=".repeat(60));
}
