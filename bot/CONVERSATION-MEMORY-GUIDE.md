# 💭 Conversation Memory System - Panduan Lengkap

## 🎯 Overview

Bot sekarang dilengkapi dengan **Conversation Memory System** yang memungkinkan:

1. 💾 **Menyimpan riwayat percakapan** setiap user
2. 🧠 **Mengingat konteks** percakapan sebelumnya
3. 🔄 **Memberikan jawaban kontekstual** berdasarkan history
4. 👤 **Mengenali returning user** dan menyapa dengan personal
5. 📊 **Tracking statistics** untuk monitoring

---

## ✨ Fitur Utama

### 1. Automatic Message Saving
```javascript
// Setiap pesan user & bot otomatis disimpan
User: "Berapa biaya pendaftaran?"
Bot: "Biaya gelombang 1 adalah Rp 500.000"
→ Tersimpan di conversations/628xxx.json
```

### 2. Conversation History
```javascript
// Bot bisa lihat 5 pesan terakhir untuk context
[02.30] User: Berapa biaya pendaftaran?
[02.30] Bot: Biaya gelombang 1 adalah Rp 500.000
[02.31] User: Ada beasiswa ga?
[02.31] Bot: Ada! Untuk peringkat 1-3 di rapor
[02.32] User: Oke, saya mau daftar
→ Bot tahu user sudah tanya biaya & beasiswa
```

### 3. Returning User Recognition
```javascript
// Bot mengenali user yang kembali
👤 Returning user - Last conversation: 2 jam yang lalu
🆕 New user - First conversation

// Bisa customize greeting:
"Halo lagi! Kemarin kita sudah bahas tentang biaya ya..."
```

### 4. Contextual Responses
```javascript
User: "Berapa biayanya?"
Bot: [Cek history → user tanya tentang jurusan TKJ]
     "Untuk jurusan TKJ, biaya pendaftaran..."
     
// Tanpa history:
Bot: "Biaya pendaftaran SMK Globin..."
```

### 5. Statistics & Monitoring
```javascript
📊 Global Stats:
   Total Users: 150
   Total Messages: 3,450
   Active Today: 45
   Avg Messages/User: 23.0
```

---

## 📁 File Structure

```
conversations/
├── 628123456789_s_whatsapp_net.json
├── 628987654321_s_whatsapp_net.json
└── ...

Format file:
[
  {
    "role": "user",
    "message": "Berapa biaya pendaftaran?",
    "timestamp": "2026-01-05T02:30:00.000Z",
    "messageType": "text"
  },
  {
    "role": "bot",
    "message": "Biaya gelombang 1 adalah Rp 500.000",
    "timestamp": "2026-01-05T02:30:01.000Z",
    "intent": "QUESTION",
    "aiUsed": true
  }
]
```

---

## 🔧 API Functions

### 1. Save Message
```javascript
import { saveMessage } from './conversation-memory.js';

// Save user message
saveMessage(userId, 'user', 'Berapa biaya pendaftaran?', {
  messageType: 'text'
});

// Save bot response
saveMessage(userId, 'bot', 'Biaya gelombang 1...', {
  intent: 'QUESTION',
  aiUsed: true
});
```

### 2. Get History
```javascript
import { getConversationHistory } from './conversation-memory.js';

// Get last 10 messages
const history = getConversationHistory(userId, 10);

// Result:
[
  { role: 'user', message: '...', timestamp: '...' },
  { role: 'bot', message: '...', timestamp: '...' }
]
```

### 3. Format for AI
```javascript
import { formatConversationForAI } from './conversation-memory.js';

// Get formatted history untuk AI context
const context = formatConversationForAI(userId, 5);

// Result:
========== RIWAYAT PERCAKAPAN ==========
[02.30] User: Berapa biaya pendaftaran?
[02.30] Bot: Biaya gelombang 1 adalah Rp 500.000
[02.31] User: Ada beasiswa ga?
==========================================
```

### 4. Check Returning User
```javascript
import { isReturningUser, getLastConversationTime } from './conversation-memory.js';

if (isReturningUser(userId)) {
  const lastTime = getLastConversationTime(userId);
  console.log(`Welcome back! Last chat: ${lastTime}`);
  // Output: "Welcome back! Last chat: 2 jam yang lalu"
}
```

### 5. Get Summary
```javascript
import { getConversationSummary } from './conversation-memory.js';

const summary = getConversationSummary(userId);
// {
//   totalMessages: 15,
//   userMessages: 8,
//   botMessages: 7,
//   firstMessage: {...},
//   lastMessage: {...},
//   isNewUser: false
// }
```

### 6. Global Stats
```javascript
import { getGlobalStats } from './conversation-memory.js';

const stats = getGlobalStats();
// {
//   totalUsers: 150,
//   totalMessages: 3450,
//   activeToday: 45,
//   avgMessagesPerUser: 23.0
// }
```

### 7. Clear History
```javascript
import { clearConversationHistory } from './conversation-memory.js';

// Clear specific user
clearConversationHistory(userId);
```

---

## 🎯 Use Cases

### Use Case 1: Personalized Greeting
```javascript
// bot/index.js
if (isReturningUser(sender)) {
  const lastTime = getLastConversationTime(sender);
  await sock.sendMessage(sender, {
    text: `👋 Halo lagi! Senang bertemu lagi.\n\n` +
          `Terakhir kita ngobrol ${lastTime}.\n` +
          `Ada yang bisa saya bantu hari ini?`
  });
} else {
  await sock.sendMessage(sender, {
    text: `👋 Halo! Selamat datang di SMK Globin.\n\n` +
          `Saya adalah asisten virtual yang siap membantu Anda.`
  });
}
```

### Use Case 2: Contextual Answers
```javascript
// Cek history untuk context
const history = getConversationHistory(sender, 5);
const previousTopics = history
  .filter(m => m.role === 'user')
  .map(m => m.message);

// Jika user sebelumnya tanya tentang jurusan
if (previousTopics.some(t => t.includes('jurusan'))) {
  // Jawab dengan context jurusan
  answer = `Untuk jurusan yang Anda tanyakan tadi, ${answer}`;
}
```

### Use Case 3: Resume Conversation
```javascript
// User kembali setelah lama
if (isReturningUser(sender)) {
  const summary = getConversationSummary(sender);
  const lastMsg = summary.lastMessage;
  
  if (lastMsg.role === 'bot' && lastMsg.message.includes('pendaftaran')) {
    await sock.sendMessage(sender, {
      text: `Halo! Kemarin kita sempat bahas tentang pendaftaran.\n\n` +
            `Apakah Anda sudah siap untuk mendaftar? 😊`
    });
  }
}
```

### Use Case 4: Admin Dashboard
```javascript
// Get stats untuk dashboard
const stats = getGlobalStats();

console.log(`
📊 Bot Statistics:
   Total Users: ${stats.totalUsers}
   Total Messages: ${stats.totalMessages}
   Active Today: ${stats.activeToday}
   Engagement: ${stats.avgMessagesPerUser} msg/user
`);
```

---

## 🔍 Integration dengan AI

### Cara 1: Pass History ke AI Prompt
```javascript
// bot/message-handler-ai.js
const conversationContext = formatConversationForAI(sender, 5);

const prompt = `
${conversationContext}

PERTANYAAN TERBARU:
"${userMessage}"

Jawab dengan mempertimbangkan riwayat percakapan di atas.
`;
```

### Cara 2: Conditional Response
```javascript
const history = getConversationHistory(sender, 10);

// Cek apakah user sudah pernah tanya hal yang sama
const alreadyAsked = history.some(m => 
  m.role === 'user' && 
  m.message.toLowerCase().includes('biaya')
);

if (alreadyAsked) {
  response = "Seperti yang saya jelaskan tadi, biaya pendaftaran...";
} else {
  response = "Biaya pendaftaran SMK Globin...";
}
```

---

## ⚙️ Configuration

### Storage Limit
```javascript
// bot/conversation-memory.js
// Keep only last 100 messages per user
if (history.length > 100) {
  history = history.slice(-100);
}
```

**Rekomendasi:**
- Development: 50 messages
- Production: 100 messages
- High traffic: 50 messages (hemat storage)

### Cache Management
```javascript
// In-memory cache untuk performa
const conversationCache = new Map();

// Auto cleanup setiap 1 jam
setInterval(() => {
  conversationCache.clear();
  console.log('🧹 Cleared conversation cache');
}, 3600000);
```

---

## 📊 Storage & Performance

### Storage Usage
```
1 user × 100 messages × 200 bytes = 20 KB
1000 users = 20 MB
10,000 users = 200 MB

✅ Very efficient!
```

### Performance
```
Read from cache: < 1ms
Read from file: 5-10ms
Write to file: 10-20ms

✅ Fast enough for real-time chat!
```

### Cleanup Strategy
```javascript
// Auto cleanup old conversations (> 30 days)
import { getAllUsers, clearConversationHistory } from './conversation-memory.js';

function cleanupOldConversations() {
  const users = getAllUsers();
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  for (const userId of users) {
    const summary = getConversationSummary(userId);
    const lastTime = new Date(summary.lastMessage?.timestamp).getTime();
    
    if (lastTime < thirtyDaysAgo) {
      clearConversationHistory(userId);
      console.log(`🗑️  Cleaned up ${userId} (inactive > 30 days)`);
    }
  }
}

// Run daily
setInterval(cleanupOldConversations, 24 * 60 * 60 * 1000);
```

---

## 🎨 Advanced Features

### 1. Conversation Analytics
```javascript
function analyzeConversation(userId) {
  const history = getConversationHistory(userId, 1000);
  
  const topics = {
    ppdb: 0,
    jurusan: 0,
    biaya: 0,
    beasiswa: 0
  };
  
  for (const msg of history) {
    if (msg.role === 'user') {
      if (msg.message.includes('daftar')) topics.ppdb++;
      if (msg.message.includes('jurusan')) topics.jurusan++;
      if (msg.message.includes('biaya')) topics.biaya++;
      if (msg.message.includes('beasiswa')) topics.beasiswa++;
    }
  }
  
  return topics;
}
```

### 2. Smart Suggestions
```javascript
const topics = analyzeConversation(userId);

if (topics.biaya > 0 && topics.ppdb === 0) {
  suggestion = "💡 Sudah siap mendaftar? Ketik 'daftar' untuk memulai!";
}
```

### 3. Conversation Export
```javascript
function exportConversation(userId, format = 'txt') {
  const history = getConversationHistory(userId, 1000);
  
  if (format === 'txt') {
    let text = `Conversation with ${userId}\n\n`;
    
    for (const msg of history) {
      const time = new Date(msg.timestamp).toLocaleString('id-ID');
      text += `[${time}] ${msg.role}: ${msg.message}\n\n`;
    }
    
    return text;
  }
}
```

---

## 🚀 Best Practices

### 1. Privacy & GDPR
```javascript
// Implement data deletion on request
app.post('/api/delete-my-data', (req, res) => {
  const userId = req.body.userId;
  clearConversationHistory(userId);
  res.json({ success: true });
});
```

### 2. Error Handling
```javascript
try {
  saveMessage(userId, 'user', message);
} catch (err) {
  console.error('Failed to save message:', err);
  // Bot tetap jalan meskipun save gagal
}
```

### 3. Monitoring
```javascript
// Log stats setiap jam
setInterval(() => {
  const stats = getGlobalStats();
  console.log(`📊 Hourly Stats: ${stats.activeToday} active users`);
}, 3600000);
```

---

## ✅ Summary

**Conversation Memory System:**
- ✅ Auto save semua pesan
- ✅ Fast retrieval (cache + file)
- ✅ Contextual AI responses
- ✅ Returning user recognition
- ✅ Statistics & analytics
- ✅ Privacy-friendly
- ✅ Production-ready

**Bot Anda sekarang punya memori seperti manusia!** 🧠✨
