// bot/index.js
import "dotenv/config";
import { DisconnectReason } from '@whiskeysockets/baileys';
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import axios from "axios";
import { getIntent } from "../lib/nlp.js";
import { loadKnowledgeBase, answerDenganGemini } from "./rag-groq.js";
import { handleMessageWithAI, setKnowledgeBase } from "./message-handler-ai.js";
import { isCancelIntent, isContinueIntent } from "./intent-detector.js";
import { saveMessage, isReturningUser, getLastConversationTime, formatConversationForAI } from "./conversation-memory.js";
import { WebSocketServer } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Konfigurasi WebSocket server
const WS_PORT = process.env.WS_PORT || 3001;
const server = http.createServer();
const wss = new WebSocketServer({ noServer: true });

// Simpan koneksi client yang aktif
const clients = new Set();

// Flag untuk menandai apakah server sudah berjalan
let isServerStarting = false;
let serverStarted = false;

// Fungsi untuk memulai server dengan port yang tersedia
function startWebSocketServer(port = WS_PORT, attempt = 0) {
  // Jika server sedang berjalan atau sedang dalam proses memulai, keluar
  if (serverStarted || isServerStarting) {
    return;
  }

  isServerStarting = true;
  const MAX_ATTEMPTS = 10;
  
  server.listen(port, '0.0.0.0')
    .on('listening', () => {
      serverStarted = true;
      isServerStarting = false;
      console.log(`WebSocket server running on ws://localhost:${port}`);
      process.env.WS_PORT = port.toString(); // Simpan port yang digunakan
    })
    .on('error', (err) => {
      isServerStarting = false;
      
      if (err.code === 'EADDRINUSE') {
        const nextPort = port + 1;
        if (attempt < MAX_ATTEMPTS) {
          console.log(`Port ${port} is in use, trying port ${nextPort}...`);
          // Gunakan setTimeout untuk memberikan jeda sebelum mencoba port berikutnya
          setTimeout(() => startWebSocketServer(nextPort, attempt + 1), 100);
        } else {
          console.error(`Could not find an available port after ${MAX_ATTEMPTS} attempts`);
          process.exit(1);
        }
      } else {
        console.error('Failed to start WebSocket server:', err);
        process.exit(1);
      }
    });
}

// Mulai WebSocket server hanya jika belum berjalan
if (!serverStarted && !isServerStarting) {
  startWebSocketServer();
}

// Variabel status bot
let isConnected = false;
let lastConnection = null;
let currentQR = null;

// Menyimpan state setiap pengguna
const userState = {};

// ========== RATE LIMITING UNTUK AI CALLS ==========
const aiCallTracker = {
  calls: [],
  maxCallsPerMinute: 20, // Maksimal 20 AI calls per menit
  maxCallsPerHour: 200,  // Maksimal 200 AI calls per jam
  
  // Cek apakah bisa melakukan AI call
  canMakeCall() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    
    // Bersihkan calls yang sudah lebih dari 1 jam
    this.calls = this.calls.filter(time => time > oneHourAgo);
    
    // Hitung calls dalam 1 menit terakhir
    const callsLastMinute = this.calls.filter(time => time > oneMinuteAgo).length;
    
    // Hitung calls dalam 1 jam terakhir
    const callsLastHour = this.calls.length;
    
    // Log untuk monitoring
    if (callsLastMinute > this.maxCallsPerMinute * 0.8) {
      console.log(`⚠️  Rate limit warning: ${callsLastMinute}/${this.maxCallsPerMinute} calls per minute`);
    }
    
    if (callsLastHour > this.maxCallsPerHour * 0.8) {
      console.log(`⚠️  Rate limit warning: ${callsLastHour}/${this.maxCallsPerHour} calls per hour`);
    }
    
    return callsLastMinute < this.maxCallsPerMinute && callsLastHour < this.maxCallsPerHour;
  },
  
  // Catat AI call
  recordCall() {
    this.calls.push(Date.now());
  },
  
  // Get stats
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

// Simpan status terakhir
let currentStatus = {
  isConnected: false,
  qrCode: null,
  lastConnection: null,
  deviceInfo: null
};

async function startBot() {
  // auth disimpan di folder "auth", jadi sekali pair, berikutnya auto login
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  // ambil versi WA Web terbaru yang kompatibel
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log("Using WA Web version:", version, "isLatest:", isLatest);

  const sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: false, // kita handle sendiri pakai qrcode-terminal
    browser: ["Chrome (Bot)", "Chrome", "10.0"],
    syncFullHistory: false,
  });

  // Event koneksi
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr, isNewLogin } = update;

    // Handle QR code
    if (qr) {
      console.log("🔵 QR code diterima, menyimpan untuk ditampilkan di dashboard...");
      currentQR = qr;
      isConnected = false;
      
      // Tampilkan QR code di terminal
      console.log('🔵 Scan QR code berikut dengan WhatsApp Anda:');
      qrcode.generate(qr, { small: true });
      
      // Simpan QR code ke file
      try {
        const qrCodePath = path.join(process.cwd(), 'public', 'whatsapp-qr.txt');
        fs.writeFileSync(qrCodePath, qr);
        console.log("✅ QR code disimpan di", qrCodePath);
      } catch (error) {
        console.error("Gagal menyimpan QR code ke file:", error);
      }
      
      // Perbarui status melalui WebSocket server
      try {
        const { updateStatus } = await import('../ws-server.js');
        updateStatus({
          isConnected: false,
          qrCode: qr,
          lastConnection: null,
          deviceInfo: null
        });
      } catch (error) {
        console.error("Gagal memperbarui status melalui WebSocket:", error);
      }
    }

    if (connection === "open") {
      console.log("✅ Bot terhubung dengan WhatsApp!");
      isConnected = true;
      lastConnection = new Date();
      currentQR = null; // Hapus QR code yang sudah tidak digunakan
      
      // Perbarui status melalui WebSocket server
      const { updateStatus } = await import('../ws-server.js');
      updateStatus({
        isConnected: true,
        qrCode: null,
        lastConnection: lastConnection.toISOString(),
        deviceInfo: {
          platform: 'WhatsApp Web',
          browser: 'Chrome',
          os: 'Windows'
        }
      });
      
      // Hapus file QR code jika ada
      try {
        const qrCodePath = path.join(process.cwd(), 'public', 'whatsapp-qr.png');
        if (fs.existsSync(qrCodePath)) {
          fs.unlinkSync(qrCodePath);
          console.log("🗑️ File QR code lama dihapus");
        }
      } catch (error) {
        console.error("Gagal menghapus file QR code:", error);
      }
    } else if (connection === 'close') {
      isConnected = false;
      console.log("❌ Koneksi WhatsApp terputus");
    }

    if (connection === "close") {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode ||
        lastDisconnect?.error?.output?.payload?.statusCode;

      console.log("❌ Koneksi terputus. Status code:", statusCode);

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      // Perbarui status koneksi
      try {
        const { updateStatus } = await import('../ws-server.js');
        updateStatus({
          isConnected: false,
          qrCode: null,
          lastConnection: new Date().toISOString(),
          deviceInfo: null
        });
      } catch (error) {
        console.error("Gagal memperbarui status koneksi:", error);
      }

      if (shouldReconnect) {
        console.log("🔄 Mencoba konek ulang dalam 5 detik...");
        setTimeout(() => {
          console.log("🔄 Mencoba menghubungkan ulang...");
          startBot();
        }, 5000);
      } else {
        console.log(
          "🚫 Logged out dari WhatsApp. Kalau mau login lagi, hapus folder 'auth' lalu jalankan ulang."
        );
      }
    }
  });

  // Simpan perubahan kredensial (supaya nggak pair ulang tiap jalanin)
  sock.ev.on("creds.update", saveCreds);

  // Handler pesan masuk
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];
        
      // Cek pesan yang tidak valid
      if (!msg?.message) return;
      
      // Abaikan pesan dari diri sendiri
      if (msg.key.fromMe) return;
      
      // Blokir pesan dari grup
      if (msg.key.remoteJid.endsWith('@g.us')) {
          console.log('Pesan dari grup diabaikan:', msg.key.remoteJid);
          return;
      }

      // Blokir pesan dari broadcast/status
      if (msg.key.remoteJid === 'status@broadcast') {
          return;
      }

      const sender = msg.key.remoteJid;

      // Ambil teks dari beberapa kemungkinan tipe pesan
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        "";

      const rawText = text.trim();
      const lowerText = rawText.toLowerCase();
      
      // Handle pesan kosong atau hanya emoji/sticker
      if (!rawText) {
        // Jika user kirim media tanpa caption dan sedang dalam proses pendaftaran
        if (userState[sender]?.step) {
          return sock.sendMessage(sender, {
            text: '⚠️ Mohon kirim pesan teks ya buat lanjutin pendaftaran.\n\n' +
                  '💡 Ketik *lanjut* untuk lihat pertanyaan saat ini\n' +
                  '💡 Ketik *batal* untuk batalkan pendaftaran'
          });
        }
        return; // Abaikan pesan kosong
      }

      // Filter spam (pesan terlalu panjang)
      if (rawText.length > 500 && userState[sender]?.step) {
        return sock.sendMessage(sender, {
          text: '⚠️ Wah, pesannya kepanjangan nih. Bisa disingkat gak? (maksimal 500 karakter ya) 😅'
        });
      }

      console.log(`📩 Pesan dari ${sender}:`, rawText);
      
      // ========== CONVERSATION MEMORY ==========
      // Save user message
      saveMessage(sender, 'user', rawText, {
        messageType: msg.message.conversation ? 'text' : 'media',
        hasCaption: !!(msg.message.imageMessage?.caption || msg.message.videoMessage?.caption)
      });
      
      // Check if returning user
      if (isReturningUser(sender)) {
        const lastTime = getLastConversationTime(sender);
        console.log(`👤 Returning user - Last conversation: ${lastTime}`);
      } else {
        console.log(`🆕 New user - First conversation`);
      }

      // ========== RATE LIMITING ==========
      // Cegah spam dengan membatasi pesan per user
      if (!userState[sender]) {
        userState[sender] = {};
      }
      
      const now = Date.now();
      const lastMessageTime = userState[sender].lastMessageTime || 0;
      const timeDiff = now - lastMessageTime;
      
      // Jika user kirim pesan < 1 detik dari pesan sebelumnya, abaikan
      if (timeDiff < 1000 && userState[sender].step) {
        console.log(`⚠️ Rate limit: ${sender} kirim pesan terlalu cepat`);
        return;
      }
      
      userState[sender].lastMessageTime = now;
      
      // ========== GLOBAL AI RATE LIMITING ==========
      // Cek apakah bisa melakukan AI call
      const canUseAI = aiCallTracker.canMakeCall();
      
      if (!canUseAI) {
        console.log('⚠️  AI rate limit reached, using fallback system only');
        
        // Jika rate limit, langsung gunakan fallback tanpa AI
        // (sistem fallback tetap bisa handle dengan baik)
      }

      // ========== SESSION TIMEOUT ==========
      // Jika user tidak aktif > 30 menit, reset session
      if (userState[sender]?.step && userState[sender].lastMessageTime) {
        const inactiveTime = now - userState[sender].lastMessageTime;
        const TIMEOUT = 30 * 60 * 1000; // 30 menit
        
        if (inactiveTime > TIMEOUT) {
          delete userState[sender];
          return sock.sendMessage(sender, {
            text: '⏰ *Sesi Pendaftaran Berakhir*\n\n' +
                  'Maaf ya, sesi pendaftaran kamu udah timeout karena gak aktif lebih dari 30 menit 😅\n\n' +
                  '💡 Ketik *Daftar* kalau mau mulai lagi ya!\n\n' +
                  'Ada yang bisa aku bantu? 🙌'
          });
        }
      }

      // ========== FLOW PENDAFTARAN ==========
      
      // Fungsi untuk memvalidasi email
      const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      // Fungsi untuk memvalidasi nomor HP
      const isValidPhone = (phone) => {
        const phoneRegex = /^[0-9]{10,15}$/;
        return phoneRegex.test(phone);
      };

      // Fungsi untuk memvalidasi tanggal (format: YYYY-MM-DD)
      const isValidDate = (dateString) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
      };

      // Fungsi untuk menampilkan menu bantuan
      const showHelpMenu = async (sender) => {
        await sock.sendMessage(sender, {
          text: `📋 *Menu Bantuan*\n\n` +
            `Ini perintah yang bisa kamu pakai:\n` +
            `• *Daftar* - Mulai proses pendaftaran\n` +
            `• *Batal* - Batalkan pendaftaran\n` +
            `• *Status* - Lihat status pendaftaran\n` +
            `• *Bantuan* - Tampilkan menu ini\n\n` +
            `Atau kamu bisa langsung tanya apa aja soal SMK Globin! 😊`
        });
      };

      // ========== AI-POWERED MESSAGE HANDLER ==========
      console.log('\n🤖 Processing message with AI system...');
      
      // Cek rate limit sebelum panggil AI
      let useAI = canUseAI;
      
      if (!useAI) {
        console.log('⚠️  Skipping AI, using fallback system');
      }
      
      const aiResult = await handleMessageWithAI(
        rawText,
        userState[sender],
        sock,
        sender,
        useAI // Pass flag apakah boleh gunakan AI
      );
      
      // Jika AI digunakan, catat call
      if (useAI && aiResult.aiUsed) {
        aiCallTracker.recordCall();
        
        // Log stats setiap 10 calls
        if (aiCallTracker.calls.length % 10 === 0) {
          const stats = aiCallTracker.getStats();
          console.log(`📊 AI Usage Stats: ${stats.callsLastMinute}/${stats.maxCallsPerMinute} per min, ${stats.callsLastHour}/${stats.maxCallsPerHour} per hour`);
        }
      }
      
      // Jika AI sudah handle pesan
      if (aiResult.handled) {
        console.log('✅ Message handled by AI system');
        
        // Execute action jika ada
        if (aiResult.action) {
          const response = await aiResult.action();
          
          // Save bot response (extract dari action jika ada)
          if (aiResult.responseText) {
            saveMessage(sender, 'bot', aiResult.responseText, {
              intent: aiResult.intent,
              aiUsed: aiResult.aiUsed
            });
          }
        }
        
        // Jika perlu start registration
        if (aiResult.shouldStartRegistration) {
          userState[sender] = {
            step: 1,
            status_pendaftaran: 'pending',
            tanggal_daftar: new Date().toISOString()
          };
        }
        
        return; // Stop processing
      }
      
      // Jika AI bilang lanjutkan ke form processing
      if (aiResult.shouldContinueToForm) {
        console.log('➡️  Continuing to form processing...');
        // Lanjutkan ke form processing di bawah
      }
      
      // ========== FALLBACK: OLD HANDLERS (jika AI gagal) ==========

      // Handle perintah bantuan
      if (lowerText === 'bantuan' || lowerText === 'help') {
        return showHelpMenu(sender);
      }

      // ========== HANDLING PERTANYAAN DI TENGAH PENDAFTARAN ==========
      // Jika user sedang dalam proses pendaftaran tapi bertanya sesuatu
      if (userState[sender]?.step && !isCancelIntent && !isContinueIntent) {
        // Cek apakah ini pertanyaan (bukan jawaban untuk form)
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
        
        // Jangan treat jawaban singkat sebagai pertanyaan
        const isShortAnswer = rawText.length < 50 && !lowerText.includes('?');
        
        if (isQuestion && !isShortAnswer) {
          // Simpan step sementara
          const currentStep = userState[sender].step;
          
          // Jawab pertanyaan dengan AI
          const answer = await answerDenganGemini(rawText);
          
          await sock.sendMessage(sender, {
            text: answer + '\n\n' +
                  '━━━━━━━━━━━━━━━━━━━━\n' +
                  '📝 *Eh iya, kamu masih dalam proses pendaftaran nih!*\n\n' +
                  `Kamu lagi di step ${currentStep}.\n\n` +
                  '💡 Mau gimana nih?\n' +
                  '• Ketik *lanjut* kalau mau lanjutin daftar\n' +
                  '• Ketik *batal* kalau mau berhenti dulu\n' +
                  '• Atau tanya lagi kalau masih ada yang pengen ditanyain 😊'
          });
          
          return; // Jangan lanjut ke step berikutnya
        }
      }

      // Handle pembatalan dengan FUZZY MATCHING (deteksi typo & variasi)
      if (isCancelIntent(rawText) && userState[sender]?.step) {
        delete userState[sender];
        return sock.sendMessage(sender, {
          text: '❌ *Pendaftaran Dibatalkan*\n\n' +
                'Oke deh, gak papa kok! Kamu bisa daftar kapan aja kalau udah siap 😊\n\n' +
                '💡 Ketik *Daftar* kalau mau mulai lagi\n' +
                '💡 Ketik *Bantuan* kalau butuh bantuan\n\n' +
                'Ada yang mau aku bantu lagi? 🙌'
        });
      }

      // Handle lanjut pendaftaran dengan FUZZY MATCHING
      if (isContinueIntent(rawText) && userState[sender]?.step) {
        const step = userState[sender].step;
        const stepMessages = {
          1: '📝 Nama lengkap kamu siapa nih? 😊',
          2: '📧 Email kamu apa?',
          3: '📱 Nomor HP kamu berapa? (contoh: 081234567890)',
          4: '🏠 Kamu lahir di mana?',
          5: '📅 Tanggal lahir kamu kapan? (format: YYYY-MM-DD, contoh: 2005-05-15)',
          6: '🚻 Jenis kelamin kamu apa? (L/P)',
          7: '🕌 Agama kamu apa?',
          8: '🏠 Alamat lengkap kamu di mana?',
          9: '👨‍👩‍👧‍👦 Nama orang tua kamu siapa?',
          10: '💼 Orang tua kamu kerja apa?',
          11: '📱 Nomor HP orang tua kamu berapa? (contoh: 081234567890)',
          12: '🏫 Kamu sekolah di mana sebelumnya?',
          13: '🏫 Alamat sekolah kamu yang dulu di mana?',
          14: '📅 Kamu lulus tahun berapa? (contoh: 2024)',
          15: '📊 Nilai raport kamu berapa? (contoh: 85.50)',
          16: '📚 Kamu mau ambil jurusan apa? (contoh: Teknik Komputer Jaringan)'
        };
        
        return sock.sendMessage(sender, {
          text: '✅ Oke gas! Yuk kita lanjutin pendaftarannya 😊\n\n' + 
                (stepMessages[step] || 'Lanjut ya...')
        });
      }

      // STEP 1: Mulai Pendaftaran
      if ((lowerText === 'daftar' || lowerText === 'mendaftar') && !userState[sender]?.step) {
        userState[sender] = { 
          step: 1,
          // Inisialisasi field default
          status_pendaftaran: 'pending',
          tanggal_daftar: new Date().toISOString()
        };
        return sock.sendMessage(sender, {
          text: '📝 *PENDAFTARAN SISWA BARU SMK GLOBIN*\n\n' +
                'Halo! Aku GLOMIN, asisten virtual SMK Globin 😊\n\n' +
                'Aku bakal bantu kamu daftar ya! Prosesnya gampang kok.\n\n' +
                '💡 *Tips buat kamu:*\n' +
                '• Kamu bisa tanya-tanya kapan aja selama proses pendaftaran\n' +
                '• Ketik *batal* kalau mau berhenti\n' +
                '• Ketik *lanjut* kalau mau lanjutin lagi\n\n' +
                '━━━━━━━━━━━━━━━━━━━━\n\n' +
                'Oke, kita mulai ya! Nama lengkap kamu siapa nih? 😊'
        });
      }

      // STEP 2: Nama Lengkap
      if (userState[sender]?.step === 1) {
        userState[sender].nama = rawText;
        userState[sender].step = 2;
        return sock.sendMessage(sender, {
          text: '📧 Oke, sekarang email kamu apa nih?'
        });
      }

      // STEP 3: Email
      if (userState[sender]?.step === 2) {
        if (!isValidEmail(rawText)) {
          return sock.sendMessage(sender, {
            text: '❌ Wah, emailnya kayaknya belum bener deh. Coba cek lagi ya! 😅'
          });
        }
        userState[sender].email = rawText;
        userState[sender].step = 3;
        return sock.sendMessage(sender, {
          text: '📱 Nomor HP kamu berapa? (contoh: 081234567890)'
        });
      }

      // STEP 4: Nomor HP
      if (userState[sender]?.step === 3) {
        if (!isValidPhone(rawText)) {
          return sock.sendMessage(sender, {
            text: '❌ Hmm, nomor HP-nya kayaknya belum bener. Coba lagi ya! (10-15 digit angka)'
          });
        }
        userState[sender].nomor = rawText;
        userState[sender].no_hp_ortu = rawText; // Set default nomor ortu sama dengan nomor siswa
        userState[sender].step = 4;
        return sock.sendMessage(sender, {
          text: '🏠 Kamu lahir di mana?'
        });
      }

      // STEP 5: Tempat Lahir
      if (userState[sender]?.step === 4) {
        userState[sender].tempat_lahir = rawText;
        userState[sender].step = 5;
        return sock.sendMessage(sender, {
          text: '📅 Tanggal lahir kamu kapan? (format: YYYY-MM-DD, contoh: 2005-05-15)'
        });
      }

      // STEP 6: Tanggal Lahir
      if (userState[sender]?.step === 5) {
        if (!isValidDate(rawText)) {
          return sock.sendMessage(sender, {
            text: '❌ Format tanggalnya belum bener nih. Pakai format YYYY-MM-DD ya (contoh: 2005-05-15)'
          });
        }
        userState[sender].tanggal_lahir = rawText;
        userState[sender].step = 6;
        return sock.sendMessage(sender, {
          text: '🚻 Jenis kelamin kamu apa? (L/P)'
        });
      }

      // STEP 7: Jenis Kelamin
      if (userState[sender]?.step === 6) {
        const jk = rawText.toUpperCase();
        if (jk !== 'L' && jk !== 'P') {
          return sock.sendMessage(sender, {
            text: '❌ Pilih L (Laki-laki) atau P (Perempuan) ya!'
          });
        }
        userState[sender].jenis_kelamin = jk;
        userState[sender].step = 7;
        return sock.sendMessage(sender, {
          text: '🕌 Agama kamu apa?'
        });
      }

      // STEP 8: Agama
      if (userState[sender]?.step === 7) {
        userState[sender].agama = rawText;
        userState[sender].step = 8;
        return sock.sendMessage(sender, {
          text: '🏠 Alamat lengkap kamu di mana?'
        });
      }

      // STEP 9: Alamat
      if (userState[sender]?.step === 8) {
        userState[sender].alamat = rawText;
        userState[sender].step = 9;
        return sock.sendMessage(sender, {
          text: '👨‍👩‍👧‍👦 Nama orang tua kamu siapa?'
        });
      }

      // STEP 10: Nama Orang Tua
      if (userState[sender]?.step === 9) {
        userState[sender].nama_ortu = rawText;
        userState[sender].step = 10;
        return sock.sendMessage(sender, {
          text: '💼 Orang tua kamu kerja apa?'
        });
      }

      // STEP 11: Pekerjaan Orang Tua
      if (userState[sender]?.step === 10) {
        userState[sender].pekerjaan_ortu = rawText;
        userState[sender].step = 11;
        return sock.sendMessage(sender, {
          text: '📱 Nomor HP orang tua kamu berapa? (contoh: 081234567890)'
        });
      }

      // STEP 12: Nomor HP Orang Tua
      if (userState[sender]?.step === 11) {
        if (!isValidPhone(rawText)) {
          return sock.sendMessage(sender, {
            text: '❌ Nomor HP-nya belum bener nih. Coba lagi ya! (10-15 digit angka)'
          });
        }
        userState[sender].no_hp_ortu = rawText;
        userState[sender].step = 12;
        return sock.sendMessage(sender, {
          text: '🏫 Kamu sekolah di mana sebelumnya?'
        });
      }

      // STEP 13: Asal Sekolah
      if (userState[sender]?.step === 12) {
        userState[sender].asal_sekolah = rawText;
        userState[sender].step = 13;
        return sock.sendMessage(sender, {
          text: '🏫 Alamat sekolah kamu yang dulu di mana?'
        });
      }

      // STEP 14: Alamat Sekolah Asal
      if (userState[sender]?.step === 13) {
        userState[sender].alamat_sekolah_asal = rawText;
        userState[sender].step = 14;
        return sock.sendMessage(sender, {
          text: '📅 Kamu lulus tahun berapa? (contoh: 2024)'
        });
      }

      // STEP 15: Tahun Lulus
      if (userState[sender]?.step === 14) {
        const tahun = parseInt(rawText);
        const tahunSekarang = new Date().getFullYear();
        
        if (isNaN(tahun) || tahun < 2000 || tahun > tahunSekarang) {
          return sock.sendMessage(sender, {
            text: `❌ Tahunnya kayaknya belum bener deh. Masukkan tahun antara 2000-${tahunSekarang} ya!`
          });
        }
        
        userState[sender].tahun_lulus = tahun;
        userState[sender].step = 15;
        return sock.sendMessage(sender, {
          text: '📊 Nilai raport kamu berapa? (contoh: 85.50)'
        });
      }

      // STEP 16: Nilai Raport
      if (userState[sender]?.step === 15) {
        const nilai = parseFloat(rawText.replace(',', '.'));
        
        if (isNaN(nilai) || nilai < 0 || nilai > 100) {
          return sock.sendMessage(sender, {
            text: '❌ Nilai harus antara 0-100 ya! (contoh: 85.50)'
          });
        }
        
        userState[sender].nilai_raport = nilai;
        userState[sender].step = 16;
        return sock.sendMessage(sender, {
          text: '📚 Kamu mau ambil jurusan apa? (contoh: Teknik Komputer Jaringan)'
        });
      }

      // STEP 17: Pilihan Jurusan 1
      if (userState[sender]?.step === 16) {
        userState[sender].pilihan_jurusan1 = rawText;
        userState[sender].step = 17;
        return sock.sendMessage(sender, {
          text: '📚 Ada pilihan jurusan kedua? (ketik "-" kalau gak ada)',
          footer: 'Ketik "-" untuk skip'
        });
      }


      // STEP 18: Pilihan Jurusan 2 (opsional)
      if (userState[sender]?.step === 17) {
        if (rawText !== '-') {
          userState[sender].pilihan_jurusan2 = rawText;
        }
        
        // Konfirmasi data
        const data = userState[sender];
        let confirmMessage = '📋 *Konfirmasi Data Pendaftaran*\n\n' +
          '👤 *Data Pribadi*\n' +
          `├ Nama: ${data.nama || 'Tidak diisi'}\n` +
          `├ Email: ${data.email || 'Tidak diisi'}\n` +
          `├ No. HP: ${data.nomor || 'Tidak diisi'}\n` +
          `├ Tempat/Tgl Lahir: ${data.tempat_lahir || '-'}, ${data.tanggal_lahir || '-'}\n` +
          `├ Jenis Kelamin: ${data.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}\n` +
          `├ Agama: ${data.agama || '-'}\n` +
          `└ Alamat: ${data.alamat || '-'}\n\n` +
          '👨‍👩‍👧‍👦 *Data Orang Tua*\n' +
          `├ Nama: ${data.nama_ortu || '-'}\n` +
          `├ Pekerjaan: ${data.pekerjaan_ortu || '-'}\n` +
          `└ No. HP: ${data.no_hp_ortu || '-'}\n\n` +
          '🏫 *Data Pendidikan*\n' +
          `├ Asal Sekolah: ${data.asal_sekolah || '-'}\n` +
          `├ Alamat Sekolah: ${data.alamat_sekolah_asal || '-'}\n` +
          `├ Tahun Lulus: ${data.tahun_lulus || '-'}\n` +
          `└ Nilai Raport: ${data.nilai_raport || '-'}\n\n` +
          '📚 *Pilihan Jurusan*\n' +
          `1. ${data.pilihan_jurusan1 || 'Tidak diisi'}\n`;
        
        if (data.pilihan_jurusan2) {
          confirmMessage += `2. ${data.pilihan_jurusan2}\n`;
        } else {
          confirmMessage += '2. -\n';
        }
        
        confirmMessage += '\nApakah data di atas sudah benar? (Ya/Tidak)';
        
        userState[sender].step = 18; // Langkah konfirmasi
        return sock.sendMessage(sender, { text: confirmMessage });
      }
      
      // STEP 19: Konfirmasi
      if (userState[sender]?.step === 18) {
        console.log('Memproses langkah konfirmasi...'); // Log untuk debugging
        // Dapatkan teks pesan dari msg
        const pesanDiterima = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        // Normalisasi input konfirmasi
        const konfirmasi = pesanDiterima.trim().toLowerCase();
        console.log('Pesan yang diterima:', pesanDiterima); // Log pesan asli
        console.log('Konfirmasi yang dinormalisasi:', konfirmasi); // Log untuk debugging
        
        if (konfirmasi === 'ya' || konfirmasi === 'y') {
          console.log('Konfirmasi YA diterima, memproses...'); // Log untuk debugging
          try {
            // Siapkan data untuk dikirim ke API
            const dataPendaftaran = {
              nama: userState[sender]?.nama || '',
              email: userState[sender]?.email || '',
              nomor: userState[sender]?.nomor || '',
              tempat_lahir: userState[sender]?.tempat_lahir || '',
              tanggal_lahir: userState[sender]?.tanggal_lahir || '',
              jenis_kelamin: userState[sender]?.jenis_kelamin || '',
              agama: userState[sender]?.agama || '',
              alamat: userState[sender]?.alamat || '',
              nama_ortu: userState[sender]?.nama_ortu || '',
              pekerjaan_ortu: userState[sender]?.pekerjaan_ortu || '',
              no_hp_ortu: userState[sender]?.no_hp_ortu || userState[sender]?.nomor || '',
              asal_sekolah: userState[sender]?.asal_sekolah || '',
              alamat_sekolah_asal: userState[sender]?.alamat_sekolah_asal || userState[sender]?.asal_sekolah || '',
              tahun_lulus: userState[sender]?.tahun_lulus || new Date().getFullYear(),
              nilai_raport: userState[sender]?.nilai_raport || 0,
              pilihan_jurusan1: userState[sender]?.pilihan_jurusan1 || '',
              pilihan_jurusan2: userState[sender]?.pilihan_jurusan2 || '',
              status_pendaftaran: 'pending',
              catatan: 'Pendaftaran melalui WhatsApp Bot'
            };
            
            console.log('Mengirim data ke API:', dataPendaftaran);
            
            // Kirim data ke API
            const response = await axios.post(
              'http://localhost:3000/api/pendaftaran',
              dataPendaftaran,
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
            
            let successMessage = 'Halo, terima kasih udah daftar di SMK Globin! 🎉\n\n' +
              '✅ *PENDAFTARAN KAMU BERHASIL!*\n\n' +
              'Ini detail pendaftaran kamu ya:\n' +
              '┌───────────────────────────┐\n' +
              `│ 👤 *Nama*: ${userState[sender]?.nama || '-'}\n` +
              `│ 📱 *No. HP*: ${userState[sender]?.nomor || '-'}\n` +
              `│ 📧 *Email*: ${userState[sender]?.email || '-'}\n` +
              `│ 🏫 *Asal Sekolah*: ${userState[sender]?.asal_sekolah || '-'}\n` +
              `│ 📚 *Jurusan Pilihan*: ${userState[sender]?.pilihan_jurusan1 || '-'}\n`;

            if (userState[sender]?.pilihan_jurusan2) {
              successMessage += `│ 📚 *Jurusan Alternatif*: ${userState[sender]?.pilihan_jurusan2 || '-'}\n`;
            }

            successMessage += '└───────────────────────────┘\n\n' +
              '📌 *LANGKAH SELANJUTNYA*\n' +
              '1. Admin kami bakal hubungi kamu maksimal 1x24 jam ya\n' +
              '2. Siapkan dokumen yang diperlukan:\n' +
              '   - Fotokopi KK dan Akta Kelahiran\n' +
              '   - Pas foto 3x4 (2 lembar)\n' +
              '   - Raport terakhir (kalau ada)\n\n' +
              '3. Nanti bakal ada info tes seleksi juga\n\n' +
              '❓ *Ada pertanyaan?*\n' +
              '📞 021-12345678 (Admin)\n' +
              '🕒 Senin - Jumat, 08:00 - 16:00 WIB\n\n' +
              'Makasih ya udah percaya sama SMK Globin. Ditunggu kedatangannya! 🙏';

            // Hapus state sebelum mengirim pesan sukses
            const userData = { ...userState[sender] };
            delete userState[sender];
            
            // Kirim pesan sukses
            console.log('Mengirim pesan sukses...'); // Log untuk debugging
            await sock.sendMessage(sender, { text: successMessage });
            console.log('Pesan sukses terkirim, menghapus state...'); // Log untuk debugging
            return; // Pastikan keluar dari fungsi setelah mengirim pesan
          } catch (err) {
            console.error("❌ Gagal kirim ke API:", err?.response?.data || err?.message || err);
            
            let errorMessage = '❌ *Gagal menyimpan data*\n\n' +
              'Terjadi kesalahan saat menyimpan data pendaftaran.\n';
            
            // Tampilkan pesan error spesifik dari API jika ada
            if (err.response?.data?.message) {
              errorMessage += `\n*Pesan error*: ${err.response.data.message}`;
            }
            
            errorMessage += '\nSilakan coba lagi dengan mengetik *Daftar*';
            
            // Hapus state untuk memungkinkan pendaftaran ulang
            delete userState[sender];
            
            return sock.sendMessage(sender, { text: errorMessage });
          }
        } else if (konfirmasi === 'tidak' || konfirmasi === 't') {
          // Reset state dan beri pesan untuk memulai ulang
          delete userState[sender];
          return sock.sendMessage(sender, {
            text: 'Oke deh, data pendaftaran kamu gak jadi disimpan ya.\n\n' +
                  'Kalau mau daftar lagi, tinggal ketik *Daftar* aja! 😊'
          });
        } else {
          console.log('Jawaban tidak valid diterima:', konfirmasi); // Log untuk debugging
          return sock.sendMessage(sender, {
            text: 'Mohon jawab dengan *Ya* (atau *y*) atau *Tidak* (atau *t*) aja ya! 😊'
          });
        }
      }

      // ========== INTENT KHUSUS: MULAI DAFTAR ==========
      // Skip intent processing if we're in the middle of registration
      if (userState[sender]?.step && userState[sender]?.step !== 9) {
        return;
      }

      const intent = getIntent(lowerText);

      if (intent === "mulai_daftar") {
        userState[sender] = { step: 1 };

        await sock.sendMessage(sender, {
          text:
            "Baik, kita mulai proses pendaftaran.\n\n" +
            "Silakan masukkan *nama lengkap* Anda:",
        });
        return;
      }

      // ========== SEMUA PERTANYAAN LAIN → GROQ AI ==========

      try {
        const jawaban = await answerDenganGemini(rawText);
        await sock.sendMessage(sender, { text: jawaban });
      } catch (e) {
        console.error("❌ Error memanggil Groq AI:", e);
        
        // Error handling yang lebih spesifik
        let errorMsg = "Maaf nih, aku lagi ada gangguan. 🙏\n\n";
        
        if (e.message?.includes('rate limit') || e.message?.includes('429')) {
          errorMsg += "Sistem lagi sibuk banget. Tunggu sebentar ya, terus coba lagi.\n\n";
        } else if (e.message?.includes('timeout') || e.message?.includes('ETIMEDOUT')) {
          errorMsg += "Koneksi timeout. Coba lagi ya!\n\n";
        } else if (e.message?.includes('API key')) {
          errorMsg += "Ada masalah dengan sistem nih.\n\n";
        } else {
          errorMsg += "Ada error teknis nih.\n\n";
        }
        
        errorMsg += "Kalau urgent, langsung hubungi:\n" +
                   "📞 (0251) 8422525\n" +
                   "📱 WA: 0812-1062-2374";
        
        await sock.sendMessage(sender, { text: errorMsg });
      }
    } catch (err) {
      console.error("❌ Error di handler messages.upsert:", err);
      
      // Jangan crash bot, tapi log error dengan detail
      console.error("Error stack:", err.stack);
      
      // Kirim pesan error ke user jika memungkinkan
      try {
        if (msg?.key?.remoteJid) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: "⚠️ Maaf, terjadi kesalahan sistem. Silakan coba lagi atau hubungi admin."
          });
        }
      } catch (sendErr) {
        console.error("❌ Gagal kirim pesan error:", sendErr);
      }
    }
  });
}

// Jalankan bot setelah knowledge base berhasil dimuat
// Fungsi untuk mendapatkan status koneksi bot
export function getBotStatus() {
  return {
    isConnected,
    lastConnection: lastConnection ? lastConnection.toISOString() : null,
    qrCode: currentQR,
    deviceInfo: isConnected ? {
      platform: 'WhatsApp Web',
      browser: 'Chrome',
      os: process.platform === 'win32' ? 'Windows' : 
          process.platform === 'darwin' ? 'macOS' : 'Linux',
      lastActive: lastConnection ? lastConnection.toISOString() : null
    } : null
  };
}

loadKnowledgeBase()
  .then((kb) => {
    console.log("📚 Knowledge Base loaded, setting cache...");
    setKnowledgeBase(kb);
    console.log("✅ AI system ready, starting bot...");
    return startBot();
  })
  .catch((err) => {
    console.error("❌ Gagal memulai bot:", err);
  });
