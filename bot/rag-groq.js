// bot/rag-groq.js - RAG System dengan Groq AI
import "dotenv/config";
import axios from "axios";
import Groq from "groq-sdk";
import { formatPPDBToText } from "./ppdb-data.js";
import { scrapeSPA } from "./scraper-puppeteer.js";

// ================== CONFIG AI ==================
const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  console.error("❌ GROQ_API_KEY tidak ditemukan. Pastikan ada di file .env");
  throw new Error("GROQ_API_KEY missing");
}

console.log("🔐 GROQ_API_KEY ter-load (prefix):", groqApiKey.slice(0, 8) + "*****");

const groq = new Groq({ apiKey: groqApiKey });
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

console.log("🤖 Using Groq AI with model:", GROQ_MODEL);

// ================== SUMBER DATA ==================
const SCHOOL_SOURCES = [
  "https://smkglobin.lovable.app/",
  "https://smkglobin.lovable.app/profil",
  "https://smkglobin.lovable.app/jurusan",
  "https://smkglobin.lovable.app/ekstrakurikuler",
  "https://smkglobin.lovable.app/fasilitas",
  "https://smkglobin.lovable.app/berita",
  "https://smkglobin.lovable.app/galeri",
  "https://smkglobin.lovable.app/statistik",
  "https://smkglobin.lovable.app/guru",
  "https://smkglobin.lovable.app/ppdb",
  "https://smkglobin.lovable.app/kontak",
];

// Halaman yang perlu di-scrape dengan Puppeteer (konten penting di-load via JS)
// Website adalah full SPA, jadi SEMUA halaman perlu Puppeteer untuk data akurat
const PUPPETEER_PAGES = [
  '/',           // Home
  '/profil',     // Profil sekolah
  '/jurusan',    // Program keahlian
  '/ekstrakurikuler', // Kegiatan ekskul
  '/berita',     // Berita sekolah
  '/galeri',     // Galeri foto
  '/statistik',  // Statistik sekolah
  '/guru',       // Data guru
  '/ppdb',       // Info pendaftaran
  '/kontak',     // Kontak sekolah
  '/fasilitas'   // Fasilitas sekolah
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

// ================== LOAD KNOWLEDGE BASE ==================
export async function loadKnowledgeBase() {
  let combined = "";
  let ppdbScrapedSuccessfully = false;

  for (const url of SCHOOL_SOURCES) {
    try {
      console.log("🌐 Fetching:", url);
      
      // Cek apakah halaman ini perlu Puppeteer
      const needsPuppeteer = PUPPETEER_PAGES.some(page => url.includes(page));
      
      if (needsPuppeteer) {
        console.log("🚀 Using Puppeteer for SPA scraping...");
        
        const content = await scrapeSPA(url, 5000); // 5 detik untuk full load
        
        if (content && content.length > 100) {
          console.log(`✅ Scraped ${url} successfully (${content.length} chars)`);
          
          // Tandai jika ini halaman PPDB
          if (url.includes('/ppdb')) {
            const hasImportantData = content.includes('Gelombang') || 
                                     content.includes('500.000') ||
                                     content.includes('JALUR PENDAFTARAN') ||
                                     content.includes('Pendaftaran PPDB');
            
            if (hasImportantData) {
              ppdbScrapedSuccessfully = true;
              combined += `\n\n[SUMBER: ${url} - INFORMASI PPDB TERBARU (SCRAPED)]\n${content}`;
            } else {
              combined += `\n\n[SUMBER: ${url}]\n${content}`;
            }
          } else {
            combined += `\n\n[SUMBER: ${url}]\n${content}`;
          }
        } else {
          console.log(`⚠️  Scraping ${url} failed or empty`);
        }
        
        // Delay antar request untuk avoid overload
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } else {
        // Halaman lain gunakan axios (lebih cepat)
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
  console.log("📚 Knowledge base length:", knowledgeBase.length);
  console.log("🔍 Preview KB (first 400 chars):", knowledgeBase.slice(0, 400));
  
  if (ppdbScrapedSuccessfully) {
    console.log("✅ PPDB data loaded from website (real-time)");
  } else {
    console.log("⚠️  PPDB data loaded from fallback file");
  }
  
  // Return knowledge base untuk caching
  return knowledgeBase;
}

// ================== BUILD CONTEXT RELEVAN ==================
function buildRelevantContext(question) {
  if (!knowledgeBase) return "";

  const kb = knowledgeBase;
  const q = question.toLowerCase();

  const keywords = [
    "smk globin", "profil", "visi", "misi", "akreditasi", "kurikulum", "sejarah",
    "jurusan", "program keahlian", "kompetensi keahlian", "tkj", "rpl", "multimedia",
    "akuntansi", "perkantoran", "pemasaran",
    "ppdb", "pendaftaran", "daftar", "syarat", "persyaratan", "dokumen", "formulir",
    "gelombang", "kuota", "jalur", "seleksi", "tes", "ujian", "nilai",
    "jadwal", "kapan", "tanggal", "batas", "deadline", "pengumuman", "waktu",
    "biaya", "spp", "uang", "bayar", "pembayaran", "cicilan", "gratis", "seragam",
    "daftar ulang", "administrasi",
    "beasiswa", "bantuan", "kip", "pip", "bos", "keringanan", "diskon",
    "fasilitas", "lab", "laboratorium", "perpustakaan", "wifi", "kantin", "mushola",
    "lapangan", "ruang kelas", "komputer",
    "ekstrakurikuler", "ekskul", "pramuka", "paskibra", "osis", "olahraga", "seni",
    "english club", "desain grafis", "marawis", "btq", "baca tulis quran",
    "guru", "pengajar", "tenaga pendidik", "kepala sekolah", "wali kelas",
    "alamat", "lokasi", "dimana", "kontak", "telepon", "telp", "hp", "whatsapp",
    "email", "website",
    "statistik", "jumlah siswa", "lulusan", "alumni", "kelulusan",
    "seragam", "jam masuk", "jam belajar", "hari sekolah", "libur",
  ];

  const sentences = kb.split(/(?<=[.!?])\s+/);
  const scored = sentences.map((s) => {
    const ls = s.toLowerCase();
    let score = 0;

    for (const kw of keywords) {
      if (ls.includes(kw)) score++;
    }

    const words = q.split(/\s+/);
    for (const w of words) {
      if (w.length > 3 && ls.includes(w)) score++;
    }

    return { s, score };
  });

  const relevant = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 80)
    .map((x) => x.s);

  if (relevant.length === 0) {
    return kb.slice(0, 15000);
  }

  return relevant.join(" ");
}

// ================== TANYA GROQ ==================
export async function answerDenganGemini(question) {
  try {
    const context = buildRelevantContext(question);

    const prompt = `Kamu adalah GLOMIN, asisten virtual SMK Globin yang ramah, helpful, dan seperti teman ngobrol.

PERSONALITY:
- Kamu seperti kakak kelas yang baik dan sabar
- Kamu pakai bahasa yang natural, tidak kaku atau formal banget
- Kamu bisa pakai bahasa gaul/santai tapi tetap sopan
- Kamu empati dan paham perasaan user
- Kamu antusias membantu calon siswa baru

CARA BICARA:
- Pakai "aku" dan "kamu" (bukan "saya" dan "Anda")
- Boleh pakai emoji yang sesuai (tapi jangan berlebihan)
- Pakai kata-kata seperti: "nih", "ya", "dong", "kok", "sih", "deh"
- Sesekali pakai pertanyaan balik untuk engage user
- Kasih encouragement: "Wah keren!", "Bagus banget!", "Pasti bisa!"

======== KNOWLEDGE BASE (DATA REAL dari website) ========
${context}
================================================================

PERTANYAAN USER:
"${question}"

ATURAN PENTING:
✅ Jawab pakai data EXACT dari knowledge base
✅ Kalau ada angka/tanggal/biaya, pakai yang PERSIS dari knowledge base
✅ Kalau info tidak ada, jujur bilang tidak tahu dan kasih kontak
✅ Jawab dengan natural, seperti ngobrol sama teman
✅ Pakai emoji yang sesuai (1-2 per paragraf, jangan berlebihan)
✅ Kalau user tanya biaya/jadwal, langsung kasih angka konkret

CONTOH GAYA JAWABAN:

User: "Berapa biaya pendaftaran?"
GLOMIN: "Halo! Untuk biaya pendaftaran SMK Globin, ada 3 gelombang nih:

💰 Gelombang 1: Rp 500.000 (sampai 31 Januari 2026)
💰 Gelombang 2: Rp 600.000 (sampai 30 April 2026)  
💰 Gelombang 3: Rp 650.000 (sampai 30 Juni 2026)

Terus SPP bulanannya cuma Rp 100.000 aja loh! Murah banget kan? 😊

Mau daftar gelombang berapa nih?"

User: "Ada beasiswa ga?"
GLOMIN: "Ada dong! 🎓 SMK Globin punya program beasiswa buat siswa berprestasi:

✨ Peringkat 1 di rapor → Gratis SPP 3 bulan
✨ Peringkat 2 di rapor → Gratis SPP 2 bulan
✨ Peringkat 3 di rapor → Gratis SPP 1 bulan

Plus ada potongan khusus buat siswa yatim juga!

Kamu peringkat berapa di kelas? Siapa tau bisa dapet beasiswa 😊"

JIKA INFO TIDAK TERSEDIA:
"Wah maaf nih, aku belum punya info lengkap soal itu 🙏

Tapi kamu bisa langsung tanya ke admin SMK Globin ya:
📞 Telepon: (0251) 8422525
📱 WhatsApp: 0812-1062-2374
📧 Email: smk_globin@yahoo.co.id

Mereka pasti bisa bantu lebih detail! Ada yang mau aku bantu lagi?"

Sekarang jawab pertanyaan user dengan gaya yang natural dan friendly seperti contoh di atas!`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: GROQ_MODEL,
      temperature: 0.8, // Lebih tinggi untuk lebih creative & natural
      max_tokens: 1024,
      top_p: 1,
    });

    return completion.choices[0]?.message?.content || "Maaf, aku lagi ada gangguan nih. Coba lagi ya! 🙏";

  } catch (err) {
    console.error("❌ Error Groq (objek full):", err);
    console.error("❌ Error Groq (message):", err.message);
    return "Maaf, aku lagi ada gangguan nih. Coba lagi ya! 🙏";
  }
}
