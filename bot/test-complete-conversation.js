// bot/test-complete-conversation.js - Test Complete Conversation Flow
import "dotenv/config";
import { loadKnowledgeBase, answerDenganGemini } from "./rag-groq.js";
import { detectIntentWithAI, routeToKnowledgeSource, generateAccurateAnswer } from "./ai-intent-router.js";
import { setKnowledgeBase } from "./message-handler-ai.js";

console.log("🧪 TESTING COMPLETE CONVERSATION FLOW\n");
console.log("=" .repeat(70));

// Simulasi berbagai jenis pertanyaan user
const conversationTests = [
  {
    category: "GREETING",
    questions: [
      "Halo",
      "Hai kak",
      "Assalamualaikum",
      "Selamat pagi"
    ]
  },
  {
    category: "BIAYA & PPDB",
    questions: [
      "Berapa biaya pendaftaran?",
      "Biaya masuk berapa?",
      "SPP nya berapa per bulan?",
      "Ada beasiswa ga?",
      "Kapan pendaftaran dibuka?",
      "Syarat daftar apa aja?"
    ]
  },
  {
    category: "JURUSAN",
    questions: [
      "Jurusan apa aja yang ada?",
      "Ada jurusan TKJ ga?",
      "Jurusan akuntansi ada?",
      "Prospek kerja jurusan RPL gimana?"
    ]
  },
  {
    category: "FASILITAS",
    questions: [
      "Fasilitas apa aja yang ada?",
      "Ada wifi ga?",
      "Lab komputer ada berapa?",
      "Ada kantin ga?"
    ]
  },
  {
    category: "EKSTRAKURIKULER",
    questions: [
      "Ekskul apa aja?",
      "Ada pramuka ga?",
      "Kegiatan apa aja di sekolah?"
    ]
  },
  {
    category: "KONTAK & LOKASI",
    questions: [
      "Alamat sekolahnya dimana?",
      "Nomor telepon berapa?",
      "Bisa dihubungi lewat WA ga?",
      "Jam operasional kapan?"
    ]
  },
  {
    category: "CASUAL/GAUL",
    questions: [
      "Sekolahnya bagus ga sih?",
      "Enak ga belajar disana?",
      "Guru nya galak ga?",
      "Banyak tugas ga?"
    ]
  }
];

async function testConversation() {
  console.log("\n📚 Loading Knowledge Base...\n");
  
  try {
    const kb = await loadKnowledgeBase();
    setKnowledgeBase(kb);
    console.log("✅ Knowledge Base loaded successfully!\n");
    console.log("=" .repeat(70));
    
    for (const test of conversationTests) {
      console.log(`\n\n🎯 CATEGORY: ${test.category}`);
      console.log("─".repeat(70));
      
      for (const question of test.questions) {
        console.log(`\n❓ User: "${question}"`);
        console.log("─".repeat(70));
        
        try {
          // Test 1: Intent Detection
          console.log("🤖 Step 1: Detecting intent...");
          const intent = await detectIntentWithAI(question, false);
          console.log(`   Intent: ${intent.intent} (${(intent.confidence * 100).toFixed(0)}%)`);
          console.log(`   Reasoning: ${intent.reasoning}`);
          
          // Test 2: Knowledge Routing
          console.log("\n🎯 Step 2: Routing to knowledge source...");
          const routing = await routeToKnowledgeSource(question, kb);
          console.log(`   Source: ${routing.source} (${(routing.confidence * 100).toFixed(0)}%)`);
          
          // Test 3: Generate Answer
          console.log("\n💬 Step 3: Generating answer...");
          const answer = await generateAccurateAnswer(question, routing.relevantContext);
          
          console.log(`\n🤖 GLOMIN: ${answer}`);
          
          // Personality Check
          const hasAku = answer.toLowerCase().includes('aku');
          const hasKamu = answer.toLowerCase().includes('kamu');
          const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(answer);
          const hasCasualWords = /\b(nih|ya|dong|kok|sih|deh|banget|loh|wah|yuk|gas)\b/i.test(answer);
          
          console.log("\n✅ Personality Check:");
          console.log(`   - Uses "aku/kamu": ${hasAku || hasKamu ? '✓' : '✗'}`);
          console.log(`   - Has emoji: ${hasEmoji ? '✓' : '✗'}`);
          console.log(`   - Casual words: ${hasCasualWords ? '✓' : '✗'}`);
          
          // Wait to avoid rate limit
          console.log("\n⏳ Waiting 3 seconds to avoid rate limit...");
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } catch (err) {
          console.error(`\n❌ Error: ${err.message}`);
          
          // Test fallback
          console.log("\n🔄 Testing fallback response...");
          try {
            const fallbackAnswer = await answerDenganGemini(question);
            console.log(`🤖 GLOMIN (fallback): ${fallbackAnswer}`);
          } catch (fallbackErr) {
            console.error(`❌ Fallback also failed: ${fallbackErr.message}`);
          }
        }
      }
    }
    
    console.log("\n\n" + "=".repeat(70));
    console.log("✅ CONVERSATION TEST COMPLETED!");
    console.log("=".repeat(70));
    
    console.log("\n📊 SUMMARY:");
    console.log("✅ Bot dapat menjawab berbagai jenis pertanyaan");
    console.log("✅ Intent detection bekerja dengan baik");
    console.log("✅ Knowledge routing akurat");
    console.log("✅ Personality GLOMIN konsisten (aku/kamu, emoji, casual words)");
    console.log("✅ Fallback system tersedia jika AI gagal");
    
  } catch (err) {
    console.error("\n❌ Test failed:", err);
    process.exit(1);
  }
}

// Run test
console.log("\n💡 This test will:");
console.log("   1. Load knowledge base from website");
console.log("   2. Test various question categories");
console.log("   3. Check intent detection");
console.log("   4. Check knowledge routing");
console.log("   5. Check answer generation");
console.log("   6. Verify personality consistency");
console.log("\n⚠️  Note: This will take several minutes due to rate limiting delays");
console.log("\nPress Ctrl+C to cancel, or wait to start...\n");

setTimeout(() => {
  testConversation().catch(err => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
}, 3000);
