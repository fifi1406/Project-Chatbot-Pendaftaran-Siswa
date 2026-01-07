# 📚 Data Sources - Summary Lengkap

## ✅ Sumber Data Bot SMK Globin

Bot mengambil data dari **11 halaman** website SMK Globin:

### 1. **Home** (`/`)
- ✅ Scraping method: Axios (fast)
- 📄 Content: Informasi umum, hero section, overview sekolah

### 2. **Profil** (`/profil`)
- ✅ Scraping method: Puppeteer (SPA)
- 📄 Content: Visi, misi, sejarah, akreditasi sekolah

### 3. **Jurusan** (`/jurusan`)
- ✅ Scraping method: Puppeteer (SPA)
- 📄 Content: 
  - Manajemen Perkantoran dan Layanan Bisnis
  - Akuntansi dan Keuangan Lembaga
  - Pemasaran
  - Kompetensi keahlian, prospek kerja

### 4. **Ekstrakurikuler** (`/ekstrakurikuler`)
- ✅ Scraping method: Puppeteer (SPA)
- 📄 Content:
  - Pramuka (Senin, 14:00-16:00)
  - Paskibra (Selasa, 14:00-16:00)
  - English Club (Rabu, 14:00-16:00)
  - Desain Grafis (Kamis, 14:00-16:00)
  - Marawis (Jumat, 14:00-16:00)
  - BTQ (Sabtu, 08:00-10:00)

### 5. **Fasilitas** (`/fasilitas`)
- ✅ Scraping method: Puppeteer (SPA)
- 📄 Content: Lab komputer, perpustakaan, wifi, kantin, mushola, dll

### 6. **Berita** (`/berita`)
- ✅ Scraping method: Axios (fast)
- 📄 Content: Berita terbaru sekolah, kegiatan, prestasi

### 7. **Galeri** (`/galeri`)
- ✅ Scraping method: Axios (fast)
- 📄 Content: Foto-foto kegiatan sekolah

### 8. **Statistik** (`/statistik`)
- ✅ Scraping method: Axios (fast)
- 📄 Content: Jumlah siswa, guru, alumni, dll

### 9. **Guru** (`/guru`)
- ✅ Scraping method: Puppeteer (SPA)
- 📄 Content: Daftar guru, tenaga pendidik, kualifikasi

### 10. **PPDB** (`/ppdb`)
- ✅ Scraping method: Puppeteer (SPA)
- 📄 Content:
  - Jadwal pendaftaran (15/12/2025 - 30/6/2026)
  - Biaya pendaftaran:
    - Gelombang 1: Rp 500.000 (s.d. 31 Jan 2026)
    - Gelombang 2: Rp 600.000 (s.d. 30 Apr 2026)
    - Gelombang 3: Rp 650.000 (s.d. 30 Jun 2026)
  - SPP Bulanan: Rp 100.000
  - Jalur prestasi & beasiswa
  - Syarat pendaftaran
  - Tahapan seleksi

### 11. **Kontak** (`/kontak`)
- ✅ Scraping method: Axios (fast)
- 📄 Content:
  - Alamat: Jl. Cibeureum Tengah RT. 06/01 Desa Sinarsari Kec. Dramaga Kab. Bogor
  - Telepon: (0251) 8422525
  - WhatsApp: 0812-1062-2374
  - Email: smk_globin@yahoo.co.id

---

## 🚀 Scraping Strategy

### Puppeteer Pages (6 halaman)
```javascript
const PUPPETEER_PAGES = [
  '/ppdb',           // ← PENTING! Data pendaftaran
  '/ekstrakurikuler', // ← PENTING! Data ekskul
  '/jurusan',        // ← PENTING! Data jurusan
  '/guru',           // ← Data guru
  '/fasilitas',      // ← Data fasilitas
  '/profil'          // ← Visi misi
];
```

**Kenapa Puppeteer?**
- Website adalah SPA (Single Page Application)
- Konten di-load via JavaScript
- Axios hanya dapat HTML kosong
- Puppeteer render JavaScript → dapat konten lengkap

### Axios Pages (5 halaman)
```javascript
const AXIOS_PAGES = [
  '/',           // Home
  '/berita',     // Berita
  '/galeri',     // Galeri
  '/statistik',  // Statistik
  '/kontak'      // Kontak
];
```

**Kenapa Axios?**
- Konten sudah ada di HTML
- Lebih cepat (< 1 detik)
- Hemat resource

---

## 📊 Coverage Analysis

### Informasi yang Tersedia ✅

**PPDB (Pendaftaran):**
- ✅ Jadwal pendaftaran
- ✅ Biaya per gelombang
- ✅ SPP bulanan
- ✅ Jalur prestasi & beasiswa
- ✅ Syarat pendaftaran
- ✅ Tahapan seleksi

**Jurusan:**
- ✅ 3 jurusan tersedia
- ✅ Kompetensi keahlian
- ✅ Prospek kerja

**Ekstrakurikuler:**
- ✅ 6 kegiatan ekskul
- ✅ Jadwal lengkap
- ✅ Deskripsi kegiatan

**Fasilitas:**
- ✅ Daftar fasilitas
- ✅ Deskripsi

**Guru:**
- ✅ Daftar guru
- ✅ Kualifikasi

**Kontak:**
- ✅ Alamat lengkap
- ✅ Telepon, WA, Email
- ✅ Jam operasional

**Profil:**
- ✅ Visi misi
- ✅ Sejarah
- ✅ Akreditasi

### Informasi yang Mungkin Kurang ⚠️

**Jika ada halaman tambahan:**
- Alumni
- Prestasi
- Kerjasama industri
- Program khusus
- Beasiswa detail

---

## 🔄 Fallback System

Jika scraping gagal, bot menggunakan **fallback data** dari `bot/ppdb-data.js`:

```javascript
export const PPDB_DATA = {
  jadwal: "15 Desember 2025 - 30 Juni 2026",
  gelombang: [
    { nama: "Gelombang 1", biaya: 500000, deadline: "31 Januari 2026" },
    { nama: "Gelombang 2", biaya: 600000, deadline: "30 April 2026" },
    { nama: "Gelombang 3", biaya: 650000, deadline: "30 Juni 2026" }
  ],
  spp: 100000,
  // ... data lengkap lainnya
};
```

**Keuntungan:**
- ✅ Bot tetap bisa jawab meskipun website down
- ✅ Data tetap akurat (manual update)
- ✅ No downtime

---

## 📈 Performance

### Scraping Time
```
Puppeteer pages: 2-3 detik per halaman
Axios pages: < 1 detik per halaman
Total: ~15-20 detik untuk load semua data
```

### Caching
```
Knowledge base di-cache di memory
Scraping hanya 1x saat bot start
Update: Restart bot untuk refresh data
```

### Storage
```
Knowledge base: ~5-10 KB (text only)
Very efficient!
```

---

## 🎯 Rekomendasi

### Untuk Production

1. **Auto Refresh Data**
   ```javascript
   // Refresh knowledge base setiap 6 jam
   setInterval(async () => {
     console.log('🔄 Refreshing knowledge base...');
     const newKB = await loadKnowledgeBase();
     setKnowledgeBase(newKB);
   }, 6 * 60 * 60 * 1000);
   ```

2. **Monitor Scraping**
   ```javascript
   // Log scraping success/fail
   if (content.length < 100) {
     console.error('⚠️ Scraping failed, using fallback');
     // Send alert to admin
   }
   ```

3. **Backup Data**
   ```javascript
   // Save scraped data to file
   fs.writeFileSync('backup-kb.json', JSON.stringify(knowledgeBase));
   ```

---

## ✅ Summary

**Data Sources:**
- ✅ 11 halaman website
- ✅ 6 halaman dengan Puppeteer (SPA)
- ✅ 5 halaman dengan Axios (fast)
- ✅ Fallback data tersedia
- ✅ Coverage lengkap

**Bot bisa jawab tentang:**
- ✅ PPDB (biaya, jadwal, syarat)
- ✅ Jurusan (3 jurusan + detail)
- ✅ Ekstrakurikuler (6 kegiatan + jadwal)
- ✅ Fasilitas
- ✅ Guru & tenaga pendidik
- ✅ Kontak & lokasi
- ✅ Visi misi & profil

**Sumber data sudah LENGKAP!** ✅🎉
