// bot/rag.js
import "dotenv/config";
import axios from "axios";
import Groq from "groq-sdk";
import { formatPPDBToText } from "./ppdb-data.js";
import { scrapeSPA } from "./scraper-puppeteer.js";

// ================== CONFIG AI ==================
const AI_PROVIDER = process.env.AI_PROVIDER || "groq"; // "groq" atau "gemini"

// Groq Configuration
const groqApiKey = process.env.GROQ_API_KEY;
let groq;

if (AI_PROVIDER === "groq") {
  if (!groqApiKey) {
    console.error("❌ GROQ_API_KEY tidak ditemukan. Pastikan ada di file .env");
    throw new Error("GROQ_API_KEY missing");
  }
  console.log("🔐 GROQ_API_KEY ter-load (prefix):", groqApiKey.slice(0, 8) + "*****");
  groq = new Groq({ apiKey: groqApiKey });
}

// Model yang digunakan
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"; // atau "mixtral-8x7b-32768"

// ================== SUMBER DATA ==================
const SCHOOL_SOURCES = [
  "https://smkglobin.lovable.app/",
  "https://smkglobin.lovable.app/profil",
  "https://smkglobin.lovable.app/jurusan",
  "https://smkglobin.lovable.app/ekstrakurikuler",
  "https://smkglobin.lovable.app/berita",
  "https://smkglobin.lovable.app/galeri",
  "https://smkglobin.lovable.app/statistik",
  "https://smkglobin.lovable.app/guru",
  "https://smkglobin.lovable.app/ppdb",
  "https://smkglobin.lovable.app/kontak",
];

let knowledgeBase = "";

// helper: bersihin HTML → text
function htmlToText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// helper: extract structured data dari HTML PPDB
function extractPPDBData(html) {
  try {
    const text = htmlToText(html);
    
    // Extract informasi penting dengan pattern matching
    const ppdbInfo = {
      raw: text,
      sections: {}
    };

    // Pattern untuk extract section-section penting
    const patterns = {
      jalurPendaftaran: /JALUR PENDAFTARAN[:\s]*([\s\S]*?)(?=TAHAPAN|BIAYA|KERINGANAN|PERSYARATAN|$)/i,
      tahapanSeleksi: /TAHAPAN SELEKSI[:\s]*([\s\S]*?)(?=JALUR|BIAYA|KERINGANAN|PERSYARATAN|$)/i,
      biayaPendidikan: /BIAYA PENDIDIKAN[:\s]*([\s\S]*?)(?=JALUR|TAHAPAN|KERINGANAN|PERSYARATAN|$)/i,
      keringananBiaya: /KERINGANAN BIAYA[:\s]*([\s\S]*?)(?=JALUR|TAHAPAN|BIAYA|PERSYARATAN|Info|$)/i,
      persyaratan: /PERSYARATAN|Persyaratan Umum[:\s]*([\s\S]*?)(?=JALUR|TAHAPAN|BIAYA|KERINGANAN|$)/i,
      kontak: /Info lebih lanjut|hubungi[:\s]*([\s\S]*?)(?=Persyaratan|JALUR|TAHAPAN|$)/i,
      jadwal: /Pendaftaran PPDB.*?(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/i
    };

    // Extract setiap section
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        ppdbInfo.sections[key] = match[1] ? match[1].trim() : match[0].trim();
      }
    }

    return ppdbInfo;
  } catch (err) {
    console.error("❌ Error extracting PPDB data:", err.message);
    return { raw: htmlToText(html), sections: {} };
  }
}

// ================== LOAD KNOWLEDGE BASE ==================
export async function loadKnowledgeBase() {
  let combined = "";
  let ppdbData = null;
  let ppdbScrapedSuccessfully = false;

  for (const url of SCHOOL_SOURCES) {
    try {
      console.log("🌐 Fetching:", url);
      
      // Jika ini halaman PPDB, gunakan Puppeteer untuk scraping SPA
      if (url.includes('/ppdb')) {
        console.log("🚀 Using Puppeteer for SPA scraping...");
        
        const content = await scrapeSPA(url, 3000);
        
        if (content && content.length > 1000) {
          // Cek apakah scraping berhasil dapat data penting
          const hasImportantData = content.includes('Gelombang') || 
                                   content.includes('500.000') ||
                                   content.includes('JALUR PENDAFTARAN') ||
                                   content.includes('Pendaftaran PPDB');
          
          if (hasImportantData) {
            console.log(`✅ PPDB data scraped successfully via Puppeteer (${content.length} chars)`);
            ppdbScrapedSuccessfully = true;
            
            // Format PPDB data untuk knowledge base
            let ppdbText = `\n\n[SUMBER: ${url} - INFORMASI PPDB TERBARU (SCRAPED)]\n`;
            ppdbText += content;
            
            combined += ppdbText;
          } else {
            console.log(`⚠️  PPDB scraping incomplete - using fallback data`);
          }
        } else {
          console.log(`⚠️  PPDB scraping failed - using fallback data`);
        }
      } else {
        // Untuk halaman lain, gunakan axios biasa (lebih cepat)
        const { data } = await axios.get(url, {
          timeout: 15000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
          },
        });

        const text = htmlToText(data);
        console.log(`✅ OK ${url} (panjang ~${text.length} karakter)`);
        combined += `\n\n[SUMBER: ${url}]\n${text}`;
      }
    } catch (err) {
      console.error("❌ Gagal fetch", url, "-", err.message);
    }
  }

  // Jika scraping PPDB gagal, gunakan data fallback
  if (!ppdbScrapedSuccessfully) {
    console.log("📋 Using PPDB fallback data from ppdb-data.js");
    const fallbackPPDB = formatPPDBToText();
    combined = fallbackPPDB + "\n\n" + combined;
  }

  knowledgeBase = combined;
  console.log("� PKnowledge base length:", knowledgeBase.length);
  console.log("🔍 Preview KB (first 400 chars):", knowledgeBase.slice(0, 400));
  
  if (ppdbScrapedSuccessfully) {
    console.log("✅ PPDB data loaded from website (real-time)");
  } else {
    console.log("⚠️  PPDB data loaded from fallback file");
  }
}

// ================== BUILD CONTEXT RELEVAN ==================
function buildRelevantContext(question) {
  if (!knowledgeBase) return "";

  const kb = knowledgeBase;
  const q = question.toLowerCase();

  // kata kunci penting untuk pertanyaan seputar pendaftaran sekolah
  const keywords = [
    // Info Sekolah
    "smk globin", "profil", "visi", "misi", "akreditasi", "kurikulum", "sejarah",
    
    // Jurusan & Program
    "jurusan", "program keahlian", "kompetensi keahlian", "tkj", "rpl", "multimedia",
    "akuntansi", "perkantoran", "pemasaran",
    
    // Pendaftaran & PPDB
    "ppdb", "pendaftaran", "daftar", "syarat", "persyaratan", "dokumen", "formulir",
    "gelombang", "kuota", "jalur", "seleksi", "tes", "ujian", "nilai",
    
    // Jadwal & Waktu
    "jadwal", "kapan", "tanggal", "batas", "deadline", "pengumuman", "waktu",
    
    // Biaya & Pembayaran
    "biaya", "spp", "uang", "bayar", "pembayaran", "cicilan", "gratis", "seragam",
    "daftar ulang", "administrasi",
    
    // Beasiswa & Bantuan
    "beasiswa", "bantuan", "kip", "pip", "bos", "keringanan", "diskon",
    
    // Fasilitas & Sarana
    "fasilitas", "lab", "laboratorium", "perpustakaan", "wifi", "kantin", "mushola",
    "lapangan", "ruang kelas", "komputer",
    
    // Ekstrakurikuler
    "ekstrakurikuler", "ekskul", "pramuka", "paskibra", "osis", "olahraga", "seni",
    
    // Guru & Tenaga Pendidik
    "guru", "pengajar", "tenaga pendidik", "kepala sekolah", "wali kelas",
    
    // Lokasi & Kontak
    "alamat", "lokasi", "dimana", "kontak", "telepon", "telp", "hp", "whatsapp",
    "email", "website",
    
    // Statistik & Data
    "statistik", "jumlah siswa", "lulusan", "alumni", "kelulusan",
    
    // Lainnya
    "seragam", "jam masuk", "jam belajar", "hari sekolah", "libur",
  ];

  const sentences = kb.split(/(?<=[.!?])\s+/);
  const scored = sentences.map((s) => {
    const ls = s.toLowerCase();
    let score = 0;

    for (const kw of keywords) {
      if (ls.includes(kw)) score++;
    }

    // kalau kalimat mengandung kata dari pertanyaan, tambah skor
    const words = q.split(/\s+/);
    for (const w of words) {
      if (w.length > 3 && ls.includes(w)) score++;
    }

    return { s, score };
  });

  const relevant = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 80) // maksimal 80 kalimat
    .map((x) => x.s);

  if (relevant.length === 0) {
    // fallback: kirim potongan awal KB
    return kb.slice(0, 15000);
  }

  return relevant.join(" ");
}

// ================== TANYA GEMINI ==================
export async function answerDenganGemini(question) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_ID });

    const context = buildRelevantContext(question);

    const prompt = `
Kamu adalah chatbot Customer Service resmi *SMK Globin* yang ramah dan informatif.

TUGAS UTAMA:
Menjawab pertanyaan seputar pendaftaran siswa baru (PPDB) dan informasi sekolah berdasarkan data REAL yang di-scrape dari website resmi.

KATEGORI PERTANYAAN YANG SERING DITANYAKAN:
1. SYARAT & DOKUMEN: syarat pendaftaran, dokumen yang diperlukan, fotokopi/asli, pas foto
2. JADWAL & WAKTU: kapan pendaftaran dibuka/ditutup, jadwal tes, pengumuman hasil
3. BIAYA: biaya pendaftaran, SPP, seragam, beasiswa, cicilan
4. JURUSAN: jurusan yang tersedia, perbedaan jurusan, prospek kerja
5. PROSES SELEKSI: ada tes atau tidak, jenis tes, nilai minimum
6. LOKASI & KONTAK: alamat sekolah, nomor telepon, jam operasional
7. STATUS PENDAFTARAN: cara cek status, konfirmasi data
8. FASILITAS: fasilitas sekolah, ekstrakurikuler, asrama

ATURAN PENTING:
✅ WAJIB gunakan informasi dari KNOWLEDGE BASE di bawah sebagai sumber UTAMA
✅ Jika ada data spesifik (biaya, tanggal, nomor telepon), gunakan PERSIS seperti di knowledge base
✅ JANGAN membuat asumsi atau memberikan informasi generik jika sudah ada data spesifik
✅ Jika ada informasi yang ditandai [SUMBER: ...ppdb] prioritaskan itu untuk pertanyaan PPDB
✅ Untuk biaya, gelombang, dan jadwal - gunakan data EXACT dari knowledge base

======== KNOWLEDGE BASE (REAL DATA dari smkglobin.lovable.app) ========
${context}
================================================================

Pertanyaan pengguna:
"${question}"

PANDUAN MENJAWAB:
- Jawab dalam bahasa Indonesia yang sopan, jelas, dan ringkas
- Gunakan emoji yang sesuai untuk membuat jawaban lebih friendly (tapi jangan berlebihan)
- Gunakan bullet point atau numbering jika ada beberapa poin
- Jika user ingin mendaftar, arahkan untuk ketik "Daftar" untuk memulai proses pendaftaran
- Untuk informasi biaya, jadwal, dan kontak - WAJIB gunakan data dari knowledge base

CONTOH JAWABAN YANG BAIK:
User: "Berapa biaya pendaftaran?"
Bot: "Biaya pendaftaran SMK Globin untuk tahun ajaran 2026/2027 tergantung gelombang:

� JALUR REGULER:
• Gelombang 1: Rp 500.000 (s.d. 31 Januari 2026 atau 75 pendaftar pertama)
• Gelombang 2: Rp 600.000 (s.d. 30 April 2026)
• Gelombang 3: Rp 650.000 (s.d. 30 Juni 2026)

💰 SPP Bulanan: Rp 100.000

🎓 JALUR PRESTASI (Gratis SPP):
• Peringkat 1 di rapor: Gratis 3 bulan
• Peringkat 2 di rapor: Gratis 2 bulan
• Peringkat 3 di rapor: Gratis 1 bulan

Ada juga potongan biaya untuk siswa/i Yatim.

Mau daftar sekarang? Ketik 'Daftar' ya! 😊"

JIKA INFORMASI TIDAK TERSEDIA:
Jika pertanyaan tidak bisa dijawab dari knowledge base atau di luar topik sekolah, jawab dengan:
"Mohon maaf, saya belum memiliki informasi mengenai hal tersebut. 🙏

Untuk informasi lebih lanjut, silakan hubungi langsung:
📞 Telepon: (0251) 8422525
📱 WhatsApp: 0812-1062-2374
📧 Email: smk_globin@yahoo.co.id
📍 Atau kunjungi langsung SMK Globin di jam kerja (Senin-Jumat, 08:00-15:00 WIB)

Apakah ada pertanyaan lain seputar pendaftaran yang bisa saya bantu?"
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("❌ Error Gemini (objek full):", err);
    console.error("❌ Error Gemini (message):", err.message);
    return "Maaf, saya sedang tidak bisa mengakses sistem AI.";
  }
}
