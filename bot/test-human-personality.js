// bot/test-human-personality.js - Test Human-Like Personality
import "dotenv/config";
import { answerDenganGemini } from "./rag-groq.js";
import { generateAccurateAnswer } from "./ai-intent-router.js";

console.log("🧪 Testing Human-Like Personality (GLOMIN)\n");
console.log("=" .repeat(60));

// Test questions
const testQuestions = [
  {
    question: "Berapa biaya pendaftaran?",
    description: "Testing biaya response"
  },
  {
    question: "Ada beasiswa ga?",
    description: "Testing beasiswa response"
  },
  {
    question: "Jurusan apa aja yang ada?",
    description: "Testing jurusan response"
  },
  {
    question: "Gimana cara daftar?",
    description: "Testing cara daftar response"
  },
  {
    question: "Alamat sekolahnya dimana?",
    description: "Testing kontak response"
  }
];

async function testPersonality() {
  console.log("\n📝 TESTING RAG SYSTEM (answerDenganGemini)\n");
  
  for (const test of testQuestions) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`❓ Question: ${test.question}`);
    console.log(`📋 Test: ${test.description}`);
    console.log(`${"─".repeat(60)}`);
    
    try {
      const answer = await answerDenganGemini(test.question);
      console.log(`\n💬 GLOMIN's Answer:\n${answer}\n`);
      
      // Check personality markers
      const hasAku = answer.toLowerCase().includes('aku');
      const hasKamu = answer.toLowerCase().includes('kamu');
      const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(answer);
      const hasCasualWords = /\b(nih|ya|dong|kok|sih|deh|banget|loh|wah)\b/i.test(answer);
      
      console.log("✅ Personality Check:");
      console.log(`   - Uses "aku/kamu": ${hasAku || hasKamu ? '✓' : '✗'}`);
      console.log(`   - Has emoji: ${hasEmoji ? '✓' : '✗'}`);
      console.log(`   - Casual words: ${hasCasualWords ? '✓' : '✗'}`);
      
      // Wait to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ Test completed!");
  console.log("\n💡 Expected personality traits:");
  console.log("   - Uses 'aku' and 'kamu' (not 'saya' and 'Anda')");
  console.log("   - Includes emojis (but not excessive)");
  console.log("   - Uses casual words: nih, ya, dong, kok, sih, deh, banget");
  console.log("   - Friendly and encouraging tone");
  console.log("   - Sometimes asks follow-up questions");
  console.log("   - Provides exact data from knowledge base");
}

// Run test
testPersonality().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
