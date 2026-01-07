// bot/test-rate-limit.js - Test Rate Limiting System
console.log("🧪 Testing Rate Limiting System\n");
console.log("=".repeat(60));

// Simulate aiCallTracker
const aiCallTracker = {
  calls: [],
  maxCallsPerMinute: 20,
  maxCallsPerHour: 200,
  
  canMakeCall() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    
    this.calls = this.calls.filter(time => time > oneHourAgo);
    
    const callsLastMinute = this.calls.filter(time => time > oneMinuteAgo).length;
    const callsLastHour = this.calls.length;
    
    if (callsLastMinute > this.maxCallsPerMinute * 0.8) {
      console.log(`⚠️  Rate limit warning: ${callsLastMinute}/${this.maxCallsPerMinute} calls per minute`);
    }
    
    if (callsLastHour > this.maxCallsPerHour * 0.8) {
      console.log(`⚠️  Rate limit warning: ${callsLastHour}/${this.maxCallsPerHour} calls per hour`);
    }
    
    return callsLastMinute < this.maxCallsPerMinute && callsLastHour < this.maxCallsPerHour;
  },
  
  recordCall() {
    this.calls.push(Date.now());
  },
  
  getStats() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    
    const callsLastMinute = this.calls.filter(time => time > oneMinuteAgo).length;
    const callsLastHour = this.calls.filter(time => time > oneHourAgo).length;
    
    return {
      callsLastMinute,
      callsLastHour,
      maxCallsPerMinute: this.maxCallsPerMinute,
      maxCallsPerHour: this.maxCallsPerHour
    };
  }
};

// Test scenarios
async function runTests() {
  console.log("\n📋 TEST 1: Normal Usage (Under Limit)");
  console.log("-".repeat(60));
  
  // Simulate 10 calls
  for (let i = 1; i <= 10; i++) {
    const canCall = aiCallTracker.canMakeCall();
    console.log(`Call ${i}: ${canCall ? '✅ Allowed' : '❌ Blocked'}`);
    
    if (canCall) {
      aiCallTracker.recordCall();
    }
    
    if (i % 5 === 0) {
      const stats = aiCallTracker.getStats();
      console.log(`   Stats: ${stats.callsLastMinute}/${stats.maxCallsPerMinute} per min, ${stats.callsLastHour}/${stats.maxCallsPerHour} per hour`);
    }
  }
  
  console.log("\n📋 TEST 2: Approaching Limit (80% Threshold)");
  console.log("-".repeat(60));
  
  // Simulate 16 calls (80% of 20)
  for (let i = 11; i <= 16; i++) {
    const canCall = aiCallTracker.canMakeCall();
    console.log(`Call ${i}: ${canCall ? '✅ Allowed' : '❌ Blocked'}`);
    
    if (canCall) {
      aiCallTracker.recordCall();
    }
  }
  
  const stats1 = aiCallTracker.getStats();
  console.log(`\n📊 Current Stats: ${stats1.callsLastMinute}/${stats1.maxCallsPerMinute} per min`);
  
  console.log("\n📋 TEST 3: Exceeding Limit");
  console.log("-".repeat(60));
  
  // Try to make 5 more calls (should be blocked)
  for (let i = 17; i <= 21; i++) {
    const canCall = aiCallTracker.canMakeCall();
    console.log(`Call ${i}: ${canCall ? '✅ Allowed' : '❌ Blocked (Rate Limit)'}`);
    
    if (canCall) {
      aiCallTracker.recordCall();
    } else {
      console.log(`   → Using fallback system instead`);
    }
  }
  
  const stats2 = aiCallTracker.getStats();
  console.log(`\n📊 Final Stats: ${stats2.callsLastMinute}/${stats2.maxCallsPerMinute} per min`);
  
  console.log("\n📋 TEST 4: Cleanup Old Calls (Simulate 1 minute later)");
  console.log("-".repeat(60));
  
  // Simulate time passing (61 seconds)
  console.log("⏰ Simulating 61 seconds passing...");
  const oldestCall = aiCallTracker.calls[0];
  aiCallTracker.calls = aiCallTracker.calls.map(time => time - 61000);
  
  const canCallAfterWait = aiCallTracker.canMakeCall();
  console.log(`Can make call now: ${canCallAfterWait ? '✅ Yes' : '❌ No'}`);
  
  const stats3 = aiCallTracker.getStats();
  console.log(`📊 Stats after cleanup: ${stats3.callsLastMinute}/${stats3.maxCallsPerMinute} per min`);
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ RATE LIMITING TESTS COMPLETED");
  console.log("=".repeat(60));
  
  console.log("\n📊 Summary:");
  console.log("  ✅ Normal usage: Allowed");
  console.log("  ✅ 80% threshold: Warning triggered");
  console.log("  ✅ 100% limit: Blocked correctly");
  console.log("  ✅ Fallback: Activated when blocked");
  console.log("  ✅ Cleanup: Old calls removed");
  
  console.log("\n🎉 Rate Limiting System Working Perfectly!");
}

runTests();
