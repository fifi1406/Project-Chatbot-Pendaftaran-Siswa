# Setup Groq AI untuk Bot SMK Globin

## Kenapa Groq?

✅ **Lebih cepat** - Response time ~500ms (vs Gemini ~2-3s)
✅ **Quota lebih besar** - Free tier: 30 requests/minute, 14,400/day
✅ **Model powerful** - Llama 3.3 70B, Mixtral 8x7B
✅ **Gratis** - Tidak perlu kartu kredit

## Langkah Setup

### 1. Dapatkan API Key Groq

1. Buka https://console.groq.com/
2. Sign up dengan Google/GitHub (gratis)
3. Klik "API Keys" di sidebar
4. Klik "Create API Key"
5. Copy API key yang muncul

### 2. Tambahkan ke .env

Edit file `.env` dan tambahkan:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3. Test Groq

```bash
node bot/test-groq.js
```

Jika berhasil, Anda akan lihat:
- ✅ Knowledge base ter-load
- ✅ Bot menjawab pertanyaan dengan akurat
- ✅ Response cepat (~1-2 detik)

## Model yang Tersedia

Ganti `GROQ_MODEL` di .env dengan salah satu:

1. **llama-3.3-70b-versatile** (Recommended)
   - Paling pintar dan balanced
   - Context: 128K tokens
   - Speed: Sangat cepat

2. **llama-3.1-70b-versatile**
   - Alternatif jika 3.3 tidak tersedia
   - Context: 128K tokens

3. **mixtral-8x7b-32768**
   - Lebih cepat, tapi kurang pintar
   - Context: 32K tokens

4. **gemma2-9b-it**
   - Paling cepat, untuk pertanyaan sederhana
   - Context: 8K tokens

## Migrasi dari Gemini ke Groq

### File yang Perlu Diupdate:

1. **bot/index.js** atau **bot/bot.js**
   
   Ganti import:
   ```javascript
   // Dari:
   import { loadKnowledgeBase, answerDenganGemini } from "./rag.js";
   
   // Ke:
   import { loadKnowledgeBase, answerDenganGemini } from "./rag-groq.js";
   ```

2. Restart bot

## Perbandingan Performance

| Feature | Gemini 2.5 Flash | Groq Llama 3.3 70B |
|---------|------------------|---------------------|
| Speed | ~2-3s | ~0.5-1s |
| Free Quota | 20/day | 14,400/day |
| Context | 1M tokens | 128K tokens |
| Bahasa Indonesia | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Akurasi | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## Troubleshooting

### Error: "Invalid API Key"
- Cek apakah GROQ_API_KEY di .env sudah benar
- Pastikan tidak ada spasi di awal/akhir
- API key harus dimulai dengan `gsk_`

### Error: "Rate limit exceeded"
- Free tier: 30 requests/minute
- Tunggu 1 menit lalu coba lagi
- Atau upgrade ke paid plan

### Response lambat
- Coba ganti model ke `gemma2-9b-it` (lebih cepat)
- Cek koneksi internet
- Groq server mungkin sedang sibuk

## Support

Jika ada masalah:
1. Cek dokumentasi Groq: https://console.groq.com/docs
2. Lihat status: https://status.groq.com/
3. Join Discord: https://discord.gg/groq
