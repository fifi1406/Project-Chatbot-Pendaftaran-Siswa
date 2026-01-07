// bot/test-ai-system.js - Test AI Intent Detection & Routing System
import "dotenv/config";
import { detectIntentWithAI, routeToKnowledgeSource, generateAccurateAnswer } from "./ai-intent-router.js";
import { loadKnowledgeBase } from "./rag-groq.js";

console.log("🧪 Testing AI Intent Detection & Routing System\n");
console.log("=" .repeat(60));

// Test cases untuk berbagai intent
const testCases = [
  // CANCEL intent
  { message: "batal", expectedIntent: "CANCEL", context: "in registration" },
  { message: "gak jadi deh", expectedIntent: "CANCEL", context: "in registration" },
  { message: "stop", expectedIntent: "CANCEL", context: "in registration" },
  { message: "udah cukup", expectedIntent: "CANCEL", context: "in registration" },
  
  // CONTINUE intent
  { message: "lanjut", expectedIntent: "CONTINUE", context: "in registration" },
  { message: "oke gas", expectedIntent: "CONTINUE", context: "in registration" },
  { message: "yuk lanjutkan", expectedIntent: "CONTINUE", context: "in registration" },
  
  // QUESTION intent
  { message: "berapa biaya pendaftaran?", expectedIntent: "QUESTION", context: "general" },
  { message: "apa saja syarat daftar?", expectedIntent: "QUESTION", context: "general" },
  { message: "kapan pendaftaran dibuka?", expectedIntent: "QUESTION", context: "general" },
  { message: "jurusan apa saja yang ada?", expectedIntent: "QUESTION", context: "general" },
  
  // QUESTION during registration
  { message: "berapa biaya spp?", expectedIntent: "QUESTION", context: "in registration" },
  { message: "ada beasiswa ga?", expectedIntent: "QUESTION", context: "in registration" },
  
  // ANSWER intent (during registration)
  { message: "Budi Santoso", expectedIntent: "ANSWER", context: "in registration" },
  { message: "budi@email.com", expectedIntent: "ANSWER", context: "in registration" },
  { message: "081234567890", expectedIntent: "ANSWER", context: "in registration" },
  
  // GREETING intent
  { message: "halo", expectedIntent: "GREETING", context: "general" },
  { message: "assalamualaikum", expectedIntent: "GREETING", context: "general" },
  
  // REGISTER intent
  { message: "daftar", expectedIntent: "REGISTER", context: "general" },
  { message: "mau mendaftar", expectedIntent: "REGISTER", context: "general" },
];

// Test routing untuk berbagai topik
const routingTestCases = [
  { question: "berapa biaya pendaftaran?", expectedSource: "PPDB" },
  { question: "apa saja syarat daftar?", expectedSource: "PPDB" },
  { question: "kapan pendaftaran dibuka?", expectedSource: "PPDB" },
  { question: "jurusan apa saja yang ada?", expectedSource: "JURUSAN" },
  { question: "ada ekstrakurikuler apa?", expectedSource: "EKSTRAKURIKULER" },
  { question: "dimana alamat sekolah?", expectedSource: "KONTAK" },
  { question: "apa visi misi sekolah?", expectedSource: "PROFIL" },
  { question: "fasilitas apa saja yang tersedia?", expectedSource: "FASILITAS" },
];

async function runTests() {
  try {
    console.log("\n📚 Loading knowledge base...");
    const kb = await loadKnowledgeBase();
    console.log(`✅ Knowledge base loaded (${kb.length} chars)\n`);
    
    // ========== TEST 1: INTENT DETECTION ==========
    console.log("\n" + "=".repeat(60));
    console.log("TEST 1: INTENT DETECTION");
    console.log("=".repeat(60) + "\n");
    
    let intentCorrect = 0;
    let intentTotal = testCases.length;
    
    for (const testCase of testCases) {
      const isInRegistration = testCase.context === "in registration";
      
      console.log(`\n📝 Testing: "${testCase.message}"`);
      console.log(`   Context: ${testCase.context}`);
      console.log(`   Expected: ${testCase.expectedIntent}`);
      
      const result = await detectIntentWithAI(testCase.message, isInRegistration);
      
      console.log(`   Got: ${result.intent} (confidence: ${(result.confidence * 100).toFixed(0)}%)`);
      console.log(`   Reasoning: ${result.reasoning}`);
      
      if (result.intent === testCase.expectedIntent) {
        console.log("   ✅ CORRECT");
        intentCorrect++;
      } else {
        console.log("   ❌ WRONG");
      }
      
      // Delay untuk avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log("\n" + "-".repeat(60));
    console.log(`Intent Detection Accuracy: ${intentCorrect}/${intentTotal} (${((intentCorrect/intentTotal)*100).toFixed(1)}%)`);
    console.log("-".repeat(60));
    
    // ========== TEST 2: KNOWLEDGE ROUTING ==========
    console.log("\n" + "=".repeat(60));
    console.log("TEST 2: KNOWLEDGE ROUTING");
    console.log("=".repeat(60) + "\n");
    
    let routingCorrect = 0;
    let routingTotal = routingTestCases.length;
    
    for (const testCase of routingTestCases) {
      console.log(`\n📝 Testing: "${testCase.question}"`);
      console.log(`   Expected source: ${testCase.expectedSource}`);
      
      const result = await routeToKnowledgeSource(testCase.question, kb);
      
      console.log(`   Got: ${result.source} (confidence: ${(result.confidence * 100).toFixed(0)}%)`);
      console.log(`   Context length: ${result.relevantContext.length} chars`);
      
      if (result.source === testCase.expectedSource) {
        console.log("   ✅ CORRECT");
        routingCorrect++;
      } else {
        console.log("   ❌ WRONG");
      }
      
      // Delay untuk avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log("\n" + "-".repeat(60));
    console.log(`Routing Accuracy: ${routingCorrect}/${routingTotal} (${((routingCorrect/routingTotal)*100).toFixed(1)}%)`);
    console.log("-".repeat(60));
    
    // ========== TEST 3: ANSWER GENERATION ==========
    console.log("\n" + "=".repeat(60));
    console.log("TEST 3: ANSWER GENERATION (Sample)");
    console.log("=".repeat(60) + "\n");
    
    const sampleQuestions = [
      "berapa biaya pendaftaran gelombang 1?",
      "apa saja syarat pendaftaran?",
      "jurusan apa saja yang ada?"
    ];
    
    for (const question of sampleQuestions) {
      console.log(`\n📝 Question: "${question}"`);
      
      // Route dulu
      const routing = await routeToKnowledgeSource(question, kb);
      console.log(`   Routed to: ${routing.source}`);
      
      // Generate answer
      const answer = await generateAccurateAnswer(question, routing.relevantContext);
      console.log(`\n   Answer:\n   ${answer.split('\n').join('\n   ')}`);
      
      // Delay untuk avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // ========== SUMMARY ==========
    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    console.log(`Intent Detection: ${intentCorrect}/${intentTotal} (${((intentCorrect/intentTotal)*100).toFixed(1)}%)`);
    console.log(`Knowledge Routing: ${routingCorrect}/${routingTotal} (${((routingCorrect/routingTotal)*100).toFixed(1)}%)`);
    console.log(`Overall System: ${((intentCorrect + routingCorrect)/(intentTotal + routingTotal)*100).toFixed(1)}% accuracy`);
    console.log("=".repeat(60));
    
    if (intentCorrect === intentTotal && routingCorrect === routingTotal) {
      console.log("\n🎉 ALL TESTS PASSED! System is working perfectly!");
    } else {
      console.log("\n⚠️  Some tests failed. Review the results above.");
    }
    
  } catch (err) {
    console.error("\n❌ Test failed with error:", err);
    console.error("Stack:", err.stack);
  }
}

// Run tests
runTests();
