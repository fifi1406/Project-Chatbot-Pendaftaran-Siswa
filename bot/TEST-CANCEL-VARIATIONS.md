# Test Case: Variasi Pembatalan Pendaftaran

## ✅ Kata Kunci yang Di-Handle

### Bahasa Indonesia Formal
- `batal` ✅
- `batalkan` ✅
- `hentikan` ✅
- `keluar` ✅

### Bahasa Indonesia Informal
- `gak jadi` ✅
- `ga jadi` ✅
- `tidak jadi` ✅
- `nggak jadi` ✅
- `gausah` ✅
- `ga usah` ✅
- `gak usah` ✅
- `tidak usah` ✅
- `udah` ✅
- `sudah` ✅
- `cukup` ✅

### Bahasa Inggris
- `cancel` ✅
- `stop` ✅
- `exit` ✅
- `quit` ✅

## 🧪 Skenario Test

### Test 1: Pembatalan di Awal
```
User: Daftar
Bot: [Mulai pendaftaran]

User: gak jadi deh
Bot: ❌ Pendaftaran Dibatalkan
     Tidak masalah! Anda bisa mendaftar kapan saja...
```

### Test 2: Pembatalan di Tengah
```
User: [Sedang di step 5]
User: batalkan aja
Bot: ❌ Pendaftaran Dibatalkan...
```

### Test 3: Pembatalan dengan Kalimat Panjang
```
User: [Sedang di step 3]
User: wah maaf ya, gak jadi daftar dulu
Bot: ❌ Pendaftaran Dibatalkan...
```

### Test 4: Pembatalan Bahasa Inggris
```
User: [Sedang di step 7]
User: cancel please
Bot: ❌ Pendaftaran Dibatalkan...
```

### Test 5: False Positive (Tidak Boleh Dibatalkan)
```
User: [Step 1 - Nama]
User: Budi Santoso
Bot: [Lanjut ke step 2] ✅ (Tidak dibatalkan)

User: [Step 8 - Alamat]
User: Jl. Pembatalan No. 123
Bot: [Lanjut ke step 9] ✅ (Tidak dibatalkan karena bukan intent batal)
```

## ✅ Kata Kunci Lanjut

### Bahasa Indonesia
- `lanjut` ✅
- `lanjutkan` ✅
- `oke` ✅
- `ok` ✅
- `ya` ✅
- `siap` ✅
- `baik` ✅
- `lanjut daftar` ✅
- `gas` ✅
- `yuk` ✅
- `ayo` ✅
- `mulai lagi` ✅

### Bahasa Inggris
- `continue` ✅
- `next` ✅
- `yes` ✅

## 🧪 Skenario Test Lanjut

### Test 1: Lanjut Setelah Bertanya
```
User: [Step 3]
User: Berapa biaya pendaftaran?
Bot: [Jawaban + opsi lanjut/batal]

User: oke lanjut
Bot: ✅ Baik, mari kita lanjutkan pendaftaran!
     📱 Masukkan nomor HP...
```

### Test 2: Lanjut dengan Variasi
```
User: [Step 5]
User: Kapan pendaftaran ditutup?
Bot: [Jawaban + opsi]

User: gas
Bot: ✅ Baik, mari kita lanjutkan pendaftaran!
     📅 Masukkan tanggal lahir...
```

### Test 3: Lanjut Bahasa Inggris
```
User: [Step 2]
User: What is the tuition fee?
Bot: [Jawaban + opsi]

User: continue
Bot: ✅ Baik, mari kita lanjutkan pendaftaran!
     📧 Masukkan alamat email...
```

## 🎯 Deteksi Pertanyaan vs Jawaban

### Pertanyaan (Akan Dijawab AI)
```
✅ "Berapa biaya pendaftaran?"
✅ "Apa saja syarat pendaftaran?"
✅ "Kapan pendaftaran dibuka?"
✅ "Gimana cara daftarnya?"
✅ "Mau tanya, ada jurusan apa aja?"
✅ "Info ekstrakurikuler dong"
```

### Jawaban Form (Tidak Dijawab AI)
```
❌ "Budi Santoso" (nama - pendek)
❌ "Jakarta" (tempat lahir - pendek)
❌ "Islam" (agama - pendek)
❌ "budi@email.com" (email - pendek)
❌ "081234567890" (nomor HP - pendek)
```

### Edge Case
```
✅ "Saya mau tanya, berapa biaya pendaftaran?" (panjang + keyword)
❌ "Jl. Apa Aja No. 123" (panjang tapi bukan pertanyaan)
✅ "Apa ada beasiswa?" (pendek tapi jelas pertanyaan)
```

## 📊 Kriteria Deteksi

### Pertanyaan Terdeteksi Jika:
1. Mengandung kata tanya: `apa`, `bagaimana`, `kapan`, `dimana`, `berapa`, dll
2. Mengandung tanda tanya `?`
3. Dimulai dengan `mau tanya`, `tanya`, `info`
4. Panjang > 50 karakter DAN mengandung keyword

### Bukan Pertanyaan Jika:
1. Panjang < 50 karakter DAN tidak ada `?`
2. Tidak mengandung kata tanya
3. Format jawaban (email, nomor, tanggal, dll)

## 🔧 Implementasi

```javascript
// Deteksi pembatalan
const cancelKeywords = [
  'batal', 'cancel', 'stop', 'keluar', 'exit', 'quit',
  'gak jadi', 'ga jadi', 'tidak jadi', 'nggak jadi',
  'batalkan', 'hentikan', 'udah', 'sudah', 'cukup',
  'gausah', 'ga usah', 'gak usah', 'tidak usah'
];

const isCancelIntent = cancelKeywords.some(keyword => 
  lowerText.includes(keyword)
);

// Deteksi lanjut
const continueKeywords = [
  'lanjut', 'lanjutkan', 'continue', 'next', 'oke', 'ok',
  'ya', 'yes', 'siap', 'baik', 'lanjut daftar',
  'gas', 'yuk', 'ayo', 'mulai lagi'
];

const isContinueIntent = continueKeywords.some(keyword => 
  lowerText === keyword || lowerText.startsWith(keyword)
);

// Deteksi pertanyaan
const questionKeywords = [
  'apa', 'bagaimana', 'kapan', 'dimana', 'berapa', 'siapa', 
  'kenapa', 'mengapa', 'biaya', 'syarat', 'jadwal', 'jurusan',
  'ekstrakurikuler', 'fasilitas', 'kontak', 'alamat', 'info',
  'bisa', 'boleh', 'ada', 'gimana', 'gmn', 'gmana'
];

const isQuestion = questionKeywords.some(kw => lowerText.includes(kw)) || 
                  lowerText.includes('?') ||
                  lowerText.startsWith('mau tanya') ||
                  lowerText.startsWith('tanya') ||
                  lowerText.startsWith('info');

const isShortAnswer = rawText.length < 50 && !lowerText.includes('?');
```

## ✅ Checklist Testing

Sebelum deploy, pastikan test semua skenario:

- [ ] Pembatalan dengan "batal"
- [ ] Pembatalan dengan "gak jadi"
- [ ] Pembatalan dengan "cancel"
- [ ] Pembatalan di berbagai step
- [ ] Lanjut dengan "lanjut"
- [ ] Lanjut dengan "oke"
- [ ] Lanjut dengan "gas"
- [ ] Pertanyaan di tengah pendaftaran
- [ ] Jawaban form tidak terdeteksi sebagai pertanyaan
- [ ] False positive tidak terjadi
- [ ] Session timeout berfungsi
- [ ] Rate limiting berfungsi

## 🎯 Expected Behavior

### Sukses:
- User bisa batal dengan berbagai cara
- User bisa lanjut dengan berbagai cara
- Pertanyaan dijawab dengan benar
- Jawaban form tidak salah deteksi

### Gagal (Harus Diperbaiki):
- Nama "Budi Batalkan" terdeteksi sebagai pembatalan
- Alamat "Jl. Apa Aja" terdeteksi sebagai pertanyaan
- User ketik "ok" tapi malah lanjut padahal tidak sedang pause
