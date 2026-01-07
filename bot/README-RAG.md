# Sistem RAG (Retrieval-Augmented Generation) - SMK Globin Bot

## Cara Kerja

Sistem ini menggunakan **hybrid approach**: scraping dinamis + fallback data.

### Flow:

1. **Scraping Otomatis**
   - Bot fetch data dari semua halaman di `SCHOOL_SOURCES`
   - Khusus untuk halaman `/ppdb`, data di-extract dengan pattern matching
   - Data disimpan di `knowledgeBase` (in-memory)

2. **Fallback System** ⭐
   - Karena website SMK Globin adalah SPA (Single Page Application), konten PPDB di-load via JavaScript
   - Scraping HTML biasa tidak dapat konten dinamis
   - Sistem otomatis detect jika scraping gagal
   - Gunakan data dari `bot/ppdb-data.js` sebagai fallback
   - **Data tetap bisa di-update** dengan edit file `ppdb-data.js`

3. **Context Building**
   - Saat user bertanya, sistem cari kalimat relevan dari knowledge base
   - Menggunakan keyword matching & scoring
   - Ambil top 80 kalimat paling relevan

4. **AI Response**
   - Context relevan + pertanyaan user dikirim ke Gemini AI
   - AI menjawab berdasarkan data dari knowledge base
   - Jawaban akurat dan sesuai dengan data PPDB terbaru

## Update Data PPDB

### Cara 1: Edit File (Recommended untuk SPA)
Edit file `bot/ppdb-data.js` dan update data sesuai kebutuhan:

```javascript
export const PPDB_DATA = {
  lastUpdate: "2026-01-05",
  jalurPendaftaran: {
    reguler: [
      {
        gelombang: 1,
        biaya: 500000,
        batasWaktu: "31 Januari 2026",
        // ... dst
      }
    ]
  }
  // ... dst
}
```

### Cara 2: Scraping Otomatis (Jika website bukan SPA)
Data di-refresh setiap kali bot restart atau panggil:
```javascript
await loadKnowledgeBase();
```

## Keuntungan Sistem Ini

✅ **Hybrid Approach** - Scraping + fallback data
✅ **Reliable** - Tetap berfungsi meski website SPA
✅ **Easy Update** - Edit 1 file untuk update semua data PPDB
✅ **Fleksibel** - Bisa tambah URL baru di `SCHOOL_SOURCES`
✅ **Smart Extraction** - Pattern matching untuk data terstruktur
✅ **Context-Aware** - AI dapat context relevan, bukan semua data

## File Structure

```
bot/
├── rag.js           # Main RAG system
├── ppdb-data.js     # Fallback PPDB data (EDIT INI untuk update)
├── test-rag.js      # Test script
└── test-scrape.js   # Test scraping
```

## Troubleshooting

### Jika jawaban bot tidak akurat:
1. Cek apakah data di `bot/ppdb-data.js` sudah update
2. Restart bot untuk reload knowledge base
3. Lihat log saat `loadKnowledgeBase()` - apakah fallback data digunakan

### Jika ingin scraping real-time dari SPA:
Install puppeteer untuk browser automation:
```bash
npm install puppeteer
```

Tapi untuk sekarang, sistem fallback sudah cukup dan lebih cepat!

## Testing

Test sistem dengan:
```bash
node bot/test-rag.js
```

Test scraping dengan:
```bash
node bot/test-scrape.js
```
