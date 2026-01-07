# Panduan Handling Bot SMK Globin

## 🛡️ Security & Filtering

### 1. Pesan yang Diabaikan
Bot otomatis mengabaikan:
- ✅ Pesan dari diri sendiri (`fromMe`)
- ✅ Pesan dari grup (`@g.us`)
- ✅ Pesan dari broadcast/status
- ✅ Pesan kosong (tanpa teks)
- ✅ Pesan spam (> 500 karakter saat pendaftaran)

### 2. Rate Limiting
- User tidak bisa kirim pesan < 1 detik dari pesan sebelumnya
- Mencegah spam dan overload sistem
- Pesan yang terlalu cepat akan diabaikan

### 3. Session Timeout
- Sesi pendaftaran otomatis expire setelah 30 menit tidak aktif
- User akan diberi notifikasi dan diminta mulai ulang
- Data pendaftaran yang belum selesai akan dihapus

## 💬 Handling Pertanyaan di Tengah Pendaftaran

### Deteksi Pertanyaan
Bot mendeteksi pertanyaan berdasarkan:
- Kata kunci: `apa`, `bagaimana`, `kapan`, `dimana`, `berapa`, `kenapa`, dll
- Topik: `biaya`, `syarat`, `jadwal`, `jurusan`, `ekstrakurikuler`, dll
- Tanda tanya (`?`)

### Flow Pertanyaan
1. User sedang di step pendaftaran
2. User bertanya sesuatu (misal: "Berapa biaya pendaftaran?")
3. Bot jawab dengan Groq AI
4. Bot tampilkan opsi:
   - Ketik `lanjut` untuk melanjutkan pendaftaran
   - Ketik `batal` untuk membatalkan
   - Atau tanyakan hal lain

### Contoh:
```
User: (sedang di step 5)
User: "Berapa biaya SPP?"

Bot: "SPP Bulanan SMK Globin adalah Rp 100.000..."
     
     ━━━━━━━━━━━━━━━━━━━━
     📝 Proses Pendaftaran Anda Masih Berlangsung
     
     Anda sedang di step 5.
     
     💡 Pilihan:
     • Ketik lanjut untuk melanjutkan pendaftaran
     • Ketik batal untuk membatalkan pendaftaran
     • Atau tanyakan hal lain jika masih ada yang ingin ditanyakan
```

## 🚫 Pembatalan Pendaftaran

### Cara Batal
User bisa membatalkan dengan berbagai cara:

**Bahasa Indonesia Formal:**
- `batal`, `batalkan`, `hentikan`, `keluar`

**Bahasa Indonesia Informal:**
- `gak jadi`, `ga jadi`, `tidak jadi`, `nggak jadi`
- `gausah`, `ga usah`, `gak usah`, `tidak usah`
- `udah`, `sudah`, `cukup`

**Bahasa Inggris:**
- `cancel`, `stop`, `exit`, `quit`

### Contoh Penggunaan:
```
User: gak jadi deh
User: batalkan aja
User: wah maaf ya, gak jadi daftar dulu
User: cancel please
User: stop
```

Semua variasi di atas akan membatalkan pendaftaran.

### Response Bot:
```
❌ Pendaftaran Dibatalkan

Tidak masalah! Anda bisa mendaftar kapan saja.

💡 Ketik Daftar jika ingin memulai pendaftaran kembali.
💡 Ketik Bantuan untuk melihat menu bantuan.

Ada yang bisa saya bantu? 😊
```

### Data yang Dihapus:
- Semua data pendaftaran yang sudah diisi
- Step/progress pendaftaran
- Session user

## ▶️ Melanjutkan Pendaftaran

### Cara Lanjut
User bisa melanjutkan dengan berbagai cara:

**Bahasa Indonesia:**
- `lanjut`, `lanjutkan`, `lanjut daftar`
- `oke`, `ok`, `ya`, `siap`, `baik`
- `gas`, `yuk`, `ayo`, `mulai lagi`

**Bahasa Inggris:**
- `continue`, `next`, `yes`

### Contoh Penggunaan:
```
User: oke lanjut
User: gas
User: yuk lanjut
User: continue
User: siap
```

### Response Bot:
Bot akan menampilkan pertanyaan terakhir sesuai step saat ini.

## ⚠️ Error Handling

### 1. Error AI (Groq)
Bot mendeteksi berbagai jenis error:

**Rate Limit (429)**
```
Maaf, saya sedang mengalami gangguan. 🙏

Sistem sedang sibuk. Mohon tunggu sebentar dan coba lagi.

Untuk bantuan langsung, hubungi:
📞 (0251) 8422525
📱 WA: 0812-1062-2374
```

**Timeout**
```
Maaf, saya sedang mengalami gangguan. 🙏

Koneksi timeout. Mohon coba lagi.

Untuk bantuan langsung, hubungi:
📞 (0251) 8422525
📱 WA: 0812-1062-2374
```

**API Key Error**
```
Maaf, saya sedang mengalami gangguan. 🙏

Terjadi masalah dengan konfigurasi sistem.

Untuk bantuan langsung, hubungi:
📞 (0251) 8422525
📱 WA: 0812-1062-2374
```

### 2. Error Sistem
Jika terjadi error sistem yang tidak terduga:
- Bot tidak akan crash
- Error di-log dengan detail (stack trace)
- User diberi pesan error yang user-friendly
- Bot tetap bisa menerima pesan berikutnya

### 3. Error Validasi
Bot memvalidasi input user:

**Email tidak valid**
```
❌ Format email tidak valid. Mohon masukkan email yang benar:
```

**Nomor HP tidak valid**
```
❌ Format nomor HP tidak valid. Contoh: 081234567890
```

**Tanggal tidak valid**
```
❌ Format tanggal tidak valid. Gunakan format YYYY-MM-DD (contoh: 2005-05-15)
```

**Tahun lulus tidak valid**
```
❌ Tahun lulus tidak valid. Masukkan tahun antara 2020-2026
```

## 📱 Handling Media

### Pesan dengan Caption
Bot bisa membaca caption dari:
- Gambar
- Video
- Dokumen

### Pesan Tanpa Caption
Jika user kirim media tanpa caption saat pendaftaran:
```
⚠️ Mohon kirim pesan teks untuk melanjutkan pendaftaran.

💡 Ketik lanjut untuk melihat pertanyaan saat ini
💡 Ketik batal untuk membatalkan pendaftaran
```

## 🔄 State Management

### User State
Setiap user memiliki state yang disimpan di memory:
```javascript
userState[sender] = {
  step: 1,                    // Step pendaftaran saat ini
  lastMessageTime: 1234567890, // Timestamp pesan terakhir
  status_pendaftaran: 'pending',
  tanggal_daftar: '2026-01-05',
  nama: 'John Doe',
  email: 'john@example.com',
  // ... data lainnya
}
```

### Reset State
State di-reset ketika:
- User ketik `batal`
- Session timeout (30 menit)
- Pendaftaran selesai

## 🎯 Best Practices

### Untuk Developer:
1. **Selalu log error** dengan detail untuk debugging
2. **Jangan crash bot** - handle semua error dengan try-catch
3. **Berikan feedback** ke user untuk setiap error
4. **Validasi input** sebelum simpan ke database
5. **Rate limiting** untuk mencegah spam
6. **Session timeout** untuk membersihkan memory

### Untuk User:
1. **Baca instruksi** dengan teliti
2. **Jawab sesuai format** yang diminta
3. **Tanyakan kapan saja** jika ada yang tidak jelas
4. **Ketik 'lanjut'** untuk melanjutkan setelah bertanya
5. **Ketik 'batal'** jika ingin membatalkan

## 📊 Monitoring

### Log yang Dicatat:
- ✅ Setiap pesan masuk (sender + text)
- ✅ Pesan yang diabaikan (grup, spam, dll)
- ✅ Error AI/sistem dengan stack trace
- ✅ Rate limit violations
- ✅ Session timeouts

### Metrics yang Dipantau:
- Jumlah pendaftaran per hari
- Success rate pendaftaran
- Error rate
- Response time AI
- User yang timeout

## 🚀 Future Improvements

Fitur yang bisa ditambahkan:
1. **Persistent storage** - Simpan state ke database agar tidak hilang saat restart
2. **Resume pendaftaran** - User bisa lanjutkan pendaftaran di lain waktu
3. **Multi-language** - Support bahasa Inggris/Sunda
4. **Voice message** - Transkripsi voice note
5. **Image recognition** - Upload dokumen via foto
6. **Payment integration** - Bayar biaya pendaftaran via bot
7. **Notification** - Kirim reminder ke user yang belum selesai daftar
8. **Analytics dashboard** - Monitor performa bot real-time
