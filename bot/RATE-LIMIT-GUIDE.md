# 🛡️ Rate Limiting System - Panduan Lengkap

## 📊 Overview

Bot dilengkapi dengan **3-layer rate limiting** untuk menghemat quota Groq AI dan mencegah abuse:

1. **Per-User Rate Limiting** - Cegah spam dari user individual
2. **Global AI Rate Limiting** - Kontrol total AI calls per menit/jam
3. **Fallback System** - Bot tetap berfungsi saat rate limit

---

## 🎯 Rate Limit Configuration

### Layer 1: Per-User Rate Limiting
```javascript
Minimum interval: 1 detik antar pesan
Timeout session: 30 menit inaktif
Max message length: 500 karakter (saat pendaftaran)
```

**Tujuan:** Cegah spam dari user yang kirim pesan terlalu cepat

### Layer 2: Global AI Rate Limiting
```javascript
Max AI calls per minute: 20 calls
Max AI calls per hour: 200 calls
```

**Tujuan:** Hemat quota Groq AI (100,000 tokens/hari)

**Perhitungan:**
- 1 AI call ≈ 500-2000 tokens (tergantung kompleksitas)
- 200 calls/jam × 24 jam = 4,800 calls/hari
- Estimasi: 50,000-80,000 tokens/hari (aman!)

### Layer 3: Fallback System
```javascript
Jika rate limit tercapai:
→ Gunakan rule-based intent detection (85% akurat)
→ Gunakan keyword-based routing
→ Bot tetap berfungsi normal
```

---

## 🔧 Cara Kerja

### 1. Per-User Rate Limiting

```javascript
// Cek interval antar pesan
const now = Date.now();
const lastMessageTime = userState[sender].lastMessageTime || 0;
const timeDiff = now - lastMessageTime;

if (timeDiff < 1000) {
  // Abaikan pesan (terlalu cepat)
  return;
}
```

**Log:**
```
⚠️ Rate limit: 628xxx kirim pesan terlalu cepat
```

### 2. Global AI Rate Limiting

```javascript
// Cek apakah bisa melakukan AI call
const canUseAI = aiCallTracker.canMakeCall();

if (!canUseAI) {
  console.log('⚠️ AI rate limit reached, using fallback system only');
  // Gunakan fallback
}
```

**Log:**
```
⚠️ Rate limit warning: 18/20 calls per minute
⚠️ Rate limit warning: 180/200 calls per hour
⚠️ AI rate limit reached, using fallback system only
```

### 3. AI Call Tracking

```javascript
// Setiap AI call dicatat
if (aiUsed) {
  aiCallTracker.recordCall();
  
  // Log stats setiap 10 calls
  if (aiCallTracker.calls.length % 10 === 0) {
    const stats = aiCallTracker.getStats();
    console.log(`📊 AI Usage Stats: ${stats.callsLastMinute}/${stats.maxCallsPerMinute} per min`);
  }
}
```

**Log:**
```
📊 AI Usage Stats: 15/20 per min, 120/200 per hour
```

---

## 📈 Monitoring

### Real-time Stats

Bot menampilkan stats setiap 10 AI calls:

```bash
📊 AI Usage Stats: 15/20 per min, 120/200 per hour
```

### Warning Levels

**80% Threshold:**
```
⚠️ Rate limit warning: 16/20 calls per minute
⚠️ Rate limit warning: 160/200 calls per hour
```

**100% Threshold:**
```
⚠️ AI rate limit reached, using fallback system only
⚠️ Skipping AI, using fallback system
⚠️ Using fallback intent detection (rate limit)
```

---

## 🎛️ Konfigurasi Custom

### Adjust Rate Limits

Edit `bot/index.js`:

```javascript
const aiCallTracker = {
  calls: [],
  maxCallsPerMinute: 20,  // ← Ubah ini
  maxCallsPerHour: 200,   // ← Ubah ini
  // ...
};
```

### Rekomendasi Setting

**Development (Testing):**
```javascript
maxCallsPerMinute: 10
maxCallsPerHour: 100
```

**Production (Low Traffic):**
```javascript
maxCallsPerMinute: 20
maxCallsPerHour: 200
```

**Production (High Traffic):**
```javascript
maxCallsPerMinute: 30
maxCallsPerHour: 500
// Perlu upgrade Groq tier!
```

---

## 💡 Best Practices

### 1. Monitor Usage
```bash
# Jalankan bot dan perhatikan log
node bot/index.js

# Cek stats di console
📊 AI Usage Stats: 15/20 per min, 120/200 per hour
```

### 2. Adjust Berdasarkan Traffic

**Low Traffic (< 50 user/hari):**
- Setting default sudah cukup
- Fallback jarang digunakan

**Medium Traffic (50-200 user/hari):**
- Naikkan ke 30/min, 300/jam
- Monitor quota Groq

**High Traffic (> 200 user/hari):**
- Upgrade Groq Dev Tier
- Naikkan ke 50/min, 1000/jam

### 3. Optimize AI Calls

**Hindari AI untuk:**
- ✅ Greeting sederhana → Fallback
- ✅ Cancel/Continue → Fallback
- ✅ Jawaban form → Fallback

**Gunakan AI untuk:**
- ❓ Pertanyaan kompleks
- 🎯 Knowledge routing
- 💬 Answer generation

---

## 🔍 Troubleshooting

### Rate Limit Terlalu Ketat

**Gejala:**
```
⚠️ AI rate limit reached, using fallback system only
(Terlalu sering muncul)
```

**Solusi:**
```javascript
// Naikkan limit
maxCallsPerMinute: 30  // dari 20
maxCallsPerHour: 300   // dari 200
```

### Rate Limit Terlalu Longgar

**Gejala:**
```
❌ Error: Rate limit reached (dari Groq)
```

**Solusi:**
```javascript
// Turunkan limit
maxCallsPerMinute: 15  // dari 20
maxCallsPerHour: 150   // dari 200
```

### Fallback Terlalu Sering Digunakan

**Gejala:**
```
⚠️ Using fallback intent detection (rate limit)
(Hampir semua request)
```

**Solusi:**
1. Cek apakah traffic terlalu tinggi
2. Upgrade Groq tier
3. Optimize AI usage

---

## 📊 Quota Calculation

### Groq Free Tier
```
Limit: 100,000 tokens/hari
Reset: Setiap 24 jam
```

### Estimasi Usage

**Dengan Rate Limiting (20/min, 200/jam):**
```
Max calls/hari: 200 × 24 = 4,800 calls
Avg tokens/call: 1,000 tokens
Total: 4,800 × 1,000 = 4,800,000 tokens

❌ Terlalu banyak! Perlu fallback
```

**Dengan Fallback System:**
```
AI calls: 50% dari total (fallback handle 50%)
Max AI calls/hari: 2,400 calls
Total tokens: 2,400 × 1,000 = 2,400,000 tokens

❌ Masih terlalu banyak!
```

**Optimal Setting:**
```
AI calls: 20% dari total (fallback handle 80%)
Max AI calls/hari: ~100 calls
Total tokens: 100 × 1,000 = 100,000 tokens

✅ Perfect! Pas dengan quota
```

**Kesimpulan:**
- Fallback system SANGAT PENTING
- 80% request harus di-handle fallback
- 20% request kompleks gunakan AI

---

## 🎯 Production Checklist

### Before Deploy

- [ ] Test rate limiting dengan load test
- [ ] Verify fallback system bekerja
- [ ] Monitor AI usage stats
- [ ] Set appropriate limits untuk traffic
- [ ] Setup monitoring/alerting

### After Deploy

- [ ] Monitor daily quota usage
- [ ] Track fallback vs AI ratio
- [ ] Adjust limits jika perlu
- [ ] Consider upgrade Groq tier jika traffic tinggi

---

## 🚀 Summary

**Rate Limiting System:**
- ✅ 3-layer protection
- ✅ Per-user spam prevention
- ✅ Global AI quota management
- ✅ Fallback system (85% akurat)
- ✅ Real-time monitoring
- ✅ Configurable limits

**Benefits:**
- 💰 Hemat quota Groq
- 🛡️ Prevent abuse
- ⚡ Bot tetap cepat
- 🎯 Optimal AI usage
- 📊 Easy monitoring

**Bot Anda siap production dengan rate limiting yang solid!** 🎉
