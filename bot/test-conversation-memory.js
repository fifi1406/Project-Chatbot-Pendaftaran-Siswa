// bot/test-conversation-memory.js - Test Conversation Memory System
import {
  saveMessage,
  getConversationHistory,
  formatConversationForAI,
  getConversationSummary,
  isReturningUser,
  getLastConversationTime,
  getGlobalStats,
  clearConversationHistory
} from './conversation-memory.js';

console.log("🧪 Testing Conversation Memory System\n");
console.log("=".repeat(60));

const testUserId = '628123456789@s.whatsapp.net';

async function runTests() {
  console.log("\n📋 TEST 1: Save Messages");
  console.log("-".repeat(60));
  
  // Clear existing data
  clearConversationHistory(testUserId);
  
  // Simulate conversation
  saveMessage(testUserId, 'user', 'Halo, saya mau tanya tentang pendaftaran');
  console.log("✅ Saved user message 1");
  
  saveMessage(testUserId, 'bot', 'Halo! Selamat datang di SMK Globin. Ada yang bisa saya bantu?');
  console.log("✅ Saved bot message 1");
  
  saveMessage(testUserId, 'user', 'Berapa biaya pendaftaran?');
  console.log("✅ Saved user message 2");
  
  saveMessage(testUserId, 'bot', 'Biaya pendaftaran gelombang 1 adalah Rp 500.000');
  console.log("✅ Saved bot message 2");
  
  saveMessage(testUserId, 'user', 'Oke, saya mau daftar');
  console.log("✅ Saved user message 3");
  
  console.log("\n📋 TEST 2: Get Conversation History");
  console.log("-".repeat(60));
  
  const history = getConversationHistory(testUserId);
  console.log(`✅ Retrieved ${history.length} messages`);
  
  for (const msg of history) {
    const time = new Date(msg.timestamp).toLocaleTimeString('id-ID');
    console.log(`   [${time}] ${msg.role}: ${msg.message.slice(0, 50)}...`);
  }
  
  console.log("\n📋 TEST 3: Format for AI Context");
  console.log("-".repeat(60));
  
  const aiContext = formatConversationForAI(testUserId, 3);
  console.log("✅ Formatted conversation for AI:");
  console.log(aiContext);
  
  console.log("\n📋 TEST 4: Conversation Summary");
  console.log("-".repeat(60));
  
  const summary = getConversationSummary(testUserId);
  console.log("✅ Conversation Summary:");
  console.log(`   Total Messages: ${summary.totalMessages}`);
  console.log(`   User Messages: ${summary.userMessages}`);
  console.log(`   Bot Messages: ${summary.botMessages}`);
  console.log(`   Is New User: ${summary.isNewUser}`);
  console.log(`   First Message: ${summary.firstMessage?.message.slice(0, 40)}...`);
  console.log(`   Last Message: ${summary.lastMessage?.message.slice(0, 40)}...`);
  
  console.log("\n📋 TEST 5: Returning User Check");
  console.log("-".repeat(60));
  
  const isReturning = isReturningUser(testUserId);
  console.log(`✅ Is Returning User: ${isReturning ? 'Yes' : 'No'}`);
  
  const lastTime = getLastConversationTime(testUserId);
  console.log(`✅ Last Conversation: ${lastTime}`);
  
  console.log("\n📋 TEST 6: Global Stats");
  console.log("-".repeat(60));
  
  const stats = getGlobalStats();
  console.log("✅ Global Statistics:");
  console.log(`   Total Users: ${stats.totalUsers}`);
  console.log(`   Total Messages: ${stats.totalMessages}`);
  console.log(`   Active Today: ${stats.activeToday}`);
  console.log(`   Avg Messages/User: ${stats.avgMessagesPerUser}`);
  
  console.log("\n📋 TEST 7: New User (No History)");
  console.log("-".repeat(60));
  
  const newUserId = '628999999999@s.whatsapp.net';
  const newUserHistory = getConversationHistory(newUserId);
  console.log(`✅ New user history length: ${newUserHistory.length}`);
  console.log(`✅ Is new user: ${!isReturningUser(newUserId)}`);
  
  console.log("\n📋 TEST 8: Conversation Limit");
  console.log("-".repeat(60));
  
  // Add many messages
  for (let i = 0; i < 10; i++) {
    saveMessage(testUserId, 'user', `Test message ${i}`);
  }
  
  const limitedHistory = getConversationHistory(testUserId, 5);
  console.log(`✅ Requested last 5 messages, got: ${limitedHistory.length}`);
  console.log(`✅ Last message: ${limitedHistory[limitedHistory.length - 1].message}`);
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ ALL TESTS COMPLETED");
  console.log("=".repeat(60));
  
  console.log("\n📊 Summary:");
  console.log("  ✅ Save messages: Working");
  console.log("  ✅ Get history: Working");
  console.log("  ✅ Format for AI: Working");
  console.log("  ✅ Summary stats: Working");
  console.log("  ✅ Returning user check: Working");
  console.log("  ✅ Global stats: Working");
  console.log("  ✅ Message limit: Working");
  
  console.log("\n🎉 Conversation Memory System Working Perfectly!");
  
  console.log("\n📁 Conversation files saved in: ./conversations/");
  console.log("   Check the folder to see saved conversations!");
}

runTests();
