# 🤖 Chatbot Pendaftaran

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/yourusername/chatbot-pendaftaran/actions/workflows/node.js.yml/badge.svg)](https://github.com/yourusername/chatbot-pendaftaran/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Sebuah WhatsApp Chatbot canggih untuk memudahkan proses pendaftaran dengan fitur Natural Language Processing (NLP) dan integrasi database MySQL.

## 🚀 Teknologi

- **Framework**: Next.js 14 (App Router)
- **WhatsApp API**: Baileys (Multi-device)
- **Database**: MySQL 8.0+
- **NLP**: Natural (Library untuk pemrosesan bahasa alami)
- **Runtime**: Node.js 18+

## ✨ Fitur Utama

- **💬 Interaksi Natural Language**
  - Memahami berbagai variasi pertanyaan pengguna
  - Respon kontekstual berdasarkan alur percakapan

- **📝 Sistem Pendaftaran Bertahap**
  - Proses pendaftaran terstruktur
  - Validasi input real-time
  - Konfirmasi data sebelum submit

- **🔌 API Endpoint**
  - RESTful API untuk integrasi eksternal
  - Webhook untuk notifikasi real-time
  - Dokumentasi API yang lengkap

- **🔒 Manajemen Sesi**
  - Penyimpanan sementara data user
  - Timeout otomatis untuk sesi tidak aktif
  - Keamanan data yang terjamin

## 📁 Struktur Folder

```
chatbot-pendaftaran/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   └── pendaftaran/    # Endpoint pendaftaran
│   └── ...
├── bot/                   # Bot WhatsApp
│   ├── handlers/          # Message handlers
│   ├── services/          # Business logic
│   └── index.js           # Entry point bot
├── lib/                   # Shared utilities
│   ├── db.js             # Database connection
│   └── nlp.js            # NLP processing
├── public/                # Static files
├── .env.local             # Environment variables
├── package.json
└── README.md
```

## 🛠️ Instalasi

### Prasyarat

- Node.js 18+
- MySQL 8.0+
- Akun WhatsApp yang sudah terdaftar

### Langkah-langkah

1. **Clone repositori**
   ```bash
   git clone https://github.com/yourusername/chatbot-pendaftaran.git
   cd chatbot-pendaftaran
   ```

2. **Instal dependensi**
   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Setup database**
   - Buat database MySQL baru
   - Import file SQL yang tersedia di `database/schema.sql`

4. **Konfigurasi environment**
   Buat file `.env.local` di root project:
   ```env
   # Database
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=chatbot_pendaftaran

   # WhatsApp
   WHATSAPP_SESSION=session
   
   # JWT
   JWT_SECRET=your_jwt_secret
   ```

## 🚀 Menjalankan Aplikasi

### Development Mode

1. **Jalankan Next.js**
   ```bash
   npm run dev
   ```

2. **Jalankan Bot WhatsApp**
   Buka terminal baru, lalu:
   ```bash
   npm run bot
   ```

### Production Mode

```bash
# Build aplikasi
npm run build

# Jalankan produksi
npm start
```

## 🔐 Login WhatsApp dengan Pairing Code

1. Pastikan bot sudah berjalan dengan perintah `npm run bot`
2. Buka WhatsApp di ponsel Anda
3. Buka **Settings** > **Linked Devices** > **Link a Device**
4. Pindai kode QR atau pilih **Use pairing code**
5. Masukkan kode pairing yang muncul di terminal
6. Tunggu hingga proses selesai (biasanya 10-30 detik)

## 📚 Dokumentasi API

### 1. Submit Pendaftaran

```http
POST /api/pendaftaran
```

**Request Body**
```json
{
  "nama_lengkap": "John Doe",
  "email": "john@example.com",
  "no_hp": "+6281234567890",
  "alamat": "Jl. Contoh No. 123"
}
```

**Response Sukses (200)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "kode_pendaftaran": "REG-123456",
    "status": "pending"
  }
}
```

**Response Error (400)**
```json
{
  "success": false,
  "error": "Email sudah terdaftar"
}
```

## 🤖 Testing Bot

1. Tambahkan nomor bot ke kontak WhatsApp Anda
2. Kirim pesan "Halo" untuk memulai
3. Ikuti instruksi yang diberikan oleh bot
4. Gunakan perintah berikut untuk pengujian:
   - `menu` - Tampilkan menu utama
   - `daftar` - Mulai proses pendaftaran
   - `bantuan` - Tampilkan bantuan
   - `status` - Cek status pendaftaran

## 🚨 Troubleshooting

### ❌ Koneksi Terputus (Connection Closed)
```
Error: Connection Closed
```
**Solusi:**
1. Pastikan koneksi internet stabil
2. Coba login ulang dengan kode pairing baru
3. Periksa log error untuk detail lebih lanjut

### ❌ Mobile API Not Supported
```
Error: Mobile API not supported
```
**Solusi:**
1. Pastikan menggunakan WhatsApp versi terbaru
2. Gunakan metode pairing code
3. Restart aplikasi WhatsApp

### ❌ Session Auth Hilang
```
Error: Authentication failed
```
**Solusi:**
1. Hapus folder `sessions` di direktori project
2. Jalankan ulang bot
3. Lakukan login ulang

## 🤝 Berkontribusi

Kontribusi sangat diterima! Ikuti langkah berikut:

1. Fork repository ini
2. Buat branch fitur (`git checkout -b fitur/namafitur`)
3. Commit perubahan (`git commit -m 'Menambahkan fitur baru'`)
4. Push ke branch (`git push origin fitur/namafitur`)
5. Buat Pull Request

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
