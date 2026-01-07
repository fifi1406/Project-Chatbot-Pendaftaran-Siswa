// bot/ai-intent-router.js - AI-Powered Intent Detection & Routing
import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * Deteksi intent user dengan Groq AI
 * @param {string} userMessage - Pesan dari user
 * @param {boolean} isInRegistration - Apakah user sedang dalam proses pendaftaran
 * @returns {Promise<Object>} { intent, confidence, reasoning, suggestedAction }
 */
export async function detectIntentWithAI(userMessage, isInRegistration = false) {
  try {
    const prompt = `Kamu adalah sistem AI yang menganalisis pesan user untuk menentukan intent (maksud) mereka.

KONTEKS:
User sedang berinteraksi dengan chatbot pendaftaran sekolah SMK Globin.
${isInRegistration ? 'User SEDANG dalam proses pendaftaran (mengisi form).' : 'User TIDAK sedang dalam proses pendaftaran.'}

PESAN USER:
"${userMessage}"

TUGAS:
Analisis pesan dan tentukan intent user dengan SANGAT AKURAT.

INTENT YANG MUNGKIN:
1. CANCEL - User ingin membatalkan/berhenti pendaftaran
   Contoh: "batal", "gak jadi", "stop", "cancel", "udah", "cukup"
   
2. CONTINUE - User ingin melanjutkan pendaftaran
   Contoh: "lanjut", "oke", "gas", "yuk", "continue", "next"
   
3. QUESTION - User bertanya tentang sekolah/pendaftaran
   Contoh: "berapa biaya?", "apa saja syarat?", "kapan pendaftaran?"
   
4. ANSWER - User menjawab pertanyaan form pendaftaran
   Contoh: "Budi Santoso", "Jakarta", "budi@email.com", "081234567890"
   
5. GREETING - User menyapa
   Contoh: "halo", "hai", "assalamualaikum", "selamat pagi"
   
6. REGISTER - User ingin memulai pendaftaran
   Contoh: "daftar", "mendaftar", "mau daftar"

ATURAN PENTING:
- Jika user sedang dalam pendaftaran dan pesan PENDEK (< 50 karakter) tanpa kata tanya, kemungkinan besar ANSWER
- Jika ada kata tanya (apa, berapa, kapan, bagaimana, dll) atau tanda "?", kemungkinan QUESTION
- Jika pesan mengandung kata pembatalan yang jelas, pasti CANCEL
- Jika pesan mengandung kata lanjut/oke/gas, kemungkinan CONTINUE
- Jangan salah deteksi nama/alamat sebagai intent lain

RESPONSE FORMAT (JSON):
{
  "intent": "CANCEL|CONTINUE|QUESTION|ANSWER|GREETING|REGISTER",
  "confidence": 0.0-1.0,
  "reasoning": "penjelasan singkat kenapa intent ini dipilih",
  "suggestedAction": "aksi yang harus dilakukan bot"
}

Jawab HANYA dengan JSON, tidak ada text lain.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: GROQ_MODEL,
      temperature: 0.1, // Rendah untuk konsistensi
      max_tokens: 200,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    // Validasi result
    if (!result.intent || !result.confidence) {
      throw new Error("Invalid AI response format");
    }
    
    console.log(`🤖 AI Intent Detection: ${result.intent} (${(result.confidence * 100).toFixed(0)}%)`);
    console.log(`   Reasoning: ${result.reasoning}`);
    
    return result;

  } catch (err) {
    console.error("❌ Error AI intent detection:", err.message);
    
    // Fallback ke rule-based jika AI gagal
    return fallbackIntentDetection(userMessage, isInRegistration);
  }
}

/**
 * Fallback intent detection jika AI gagal
 */
export function fallbackIntentDetection(userMessage, isInRegistration) {
  const lower = userMessage.toLowerCase();
  
  // Cancel keywords (lebih lengkap)
  const cancelKeywords = ['batal', 'cancel', 'stop', 'gak jadi', 'ga jadi', 'tidak jadi', 
                          'nggak jadi', 'batalkan', 'hentikan', 'udah', 'sudah', 'cukup'];
  if (cancelKeywords.some(k => lower.includes(k))) {
    return {
      intent: 'CANCEL',
      confidence: 0.9,
      reasoning: 'Fallback: Detected cancel keyword',
      suggestedAction: 'Cancel registration'
    };
  }
  
  // Continue keywords
  if (['lanjut', 'oke', 'ok', 'gas', 'yuk', 'continue', 'next', 'ya', 'siap', 'baik'].some(k => lower.includes(k))) {
    return {
      intent: 'CONTINUE',
      confidence: 0.9,
      reasoning: 'Fallback: Detected continue keyword',
      suggestedAction: 'Continue registration'
    };
  }
  
  // Greeting keywords (tambahan)
  const greetingKeywords = ['halo', 'hai', 'hi', 'hello', 'assalamualaikum', 'selamat pagi', 
                            'selamat siang', 'selamat sore', 'selamat malam', 'pagi', 'siang', 'sore', 'malam'];
  if (greetingKeywords.some(k => lower === k || lower.startsWith(k + ' '))) {
    return {
      intent: 'GREETING',
      confidence: 0.9,
      reasoning: 'Fallback: Detected greeting keyword',
      suggestedAction: 'Greet user'
    };
  }
  
  // Register keywords
  if (['daftar', 'mendaftar', 'register', 'mau daftar'].some(k => lower.includes(k))) {
    return {
      intent: 'REGISTER',
      confidence: 0.9,
      reasoning: 'Fallback: Detected register keyword',
      suggestedAction: 'Start registration'
    };
  }
  
  // Question keywords
  if (['apa', 'berapa', 'kapan', 'bagaimana', 'dimana', 'siapa', 'kenapa', 'mengapa', '?'].some(k => lower.includes(k))) {
    return {
      intent: 'QUESTION',
      confidence: 0.8,
      reasoning: 'Fallback: Detected question keyword',
      suggestedAction: 'Answer question'
    };
  }
  
  // Default: jika dalam pendaftaran, anggap sebagai jawaban
  if (isInRegistration) {
    return {
      intent: 'ANSWER',
      confidence: 0.7,
      reasoning: 'Fallback: User in registration, likely answering',
      suggestedAction: 'Process as form answer'
    };
  }
  
  return {
    intent: 'QUESTION',
    confidence: 0.5,
    reasoning: 'Fallback: Unknown intent, treat as question',
    suggestedAction: 'Answer with AI'
  };
}

/**
 * Route ke knowledge base yang tepat berdasarkan pertanyaan
 * @param {string} question - Pertanyaan user
 * @param {string} fullKnowledgeBase - Full knowledge base
 * @returns {Promise<Object>} { source, relevantContext }
 */
export async function routeToKnowledgeSource(question, fullKnowledgeBase) {
  try {
    const prompt = `Kamu adalah sistem routing yang menentukan sumber informasi mana yang paling relevan untuk menjawab pertanyaan user.

PERTANYAAN USER:
"${question}"

SUMBER INFORMASI YANG TERSEDIA:
1. PPDB - Informasi pendaftaran, biaya, jadwal, syarat, gelombang
2. JURUSAN - Program keahlian, kompetensi, prospek kerja
3. EKSTRAKURIKULER - Kegiatan ekskul, jadwal, deskripsi
4. FASILITAS - Sarana prasarana sekolah
5. KONTAK - Alamat, telepon, email, jam operasional
6. PROFIL - Visi misi, sejarah, akreditasi sekolah
7. GENERAL - Informasi umum lainnya

TUGAS:
Tentukan sumber informasi mana yang PALING RELEVAN untuk menjawab pertanyaan ini.

RESPONSE FORMAT (JSON):
{
  "primarySource": "PPDB|JURUSAN|EKSTRAKURIKULER|FASILITAS|KONTAK|PROFIL|GENERAL",
  "secondarySource": "optional, jika perlu sumber tambahan",
  "confidence": 0.0-1.0,
  "reasoning": "penjelasan singkat"
}

Jawab HANYA dengan JSON.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: GROQ_MODEL,
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: "json_object" }
    });

    const routing = JSON.parse(completion.choices[0].message.content);
    
    console.log(`🎯 AI Routing: ${routing.primarySource} (${(routing.confidence * 100).toFixed(0)}%)`);
    console.log(`   Reasoning: ${routing.reasoning}`);
    
    // Extract relevant context dari knowledge base
    const relevantContext = extractRelevantContext(
      fullKnowledgeBase, 
      routing.primarySource,
      routing.secondarySource
    );
    
    return {
      source: routing.primarySource,
      secondarySource: routing.secondarySource,
      confidence: routing.confidence,
      relevantContext
    };

  } catch (err) {
    console.error("❌ Error AI routing:", err.message);
    
    // Fallback: return full knowledge base
    return {
      source: 'GENERAL',
      confidence: 0.5,
      relevantContext: fullKnowledgeBase.slice(0, 15000)
    };
  }
}

/**
 * Extract context yang relevan dari knowledge base
 */
function extractRelevantContext(knowledgeBase, primarySource, secondarySource) {
  const sourceKeywords = {
    PPDB: ['ppdb', 'pendaftaran', 'daftar', 'biaya', 'syarat', 'gelombang', 'jalur'],
    JURUSAN: ['jurusan', 'program keahlian', 'kompetensi', 'tkj', 'rpl', 'akuntansi'],
    EKSTRAKURIKULER: ['ekstrakurikuler', 'ekskul', 'pramuka', 'paskibra', 'english club'],
    FASILITAS: ['fasilitas', 'lab', 'perpustakaan', 'wifi', 'kantin', 'mushola'],
    KONTAK: ['kontak', 'alamat', 'telepon', 'email', 'lokasi', 'dimana'],
    PROFIL: ['profil', 'visi', 'misi', 'sejarah', 'akreditasi'],
    GENERAL: []
  };
  
  const keywords = [
    ...(sourceKeywords[primarySource] || []),
    ...(sourceKeywords[secondarySource] || [])
  ];
  
  if (keywords.length === 0) {
    return knowledgeBase.slice(0, 15000);
  }
  
  // Split knowledge base by source markers
  const sections = knowledgeBase.split(/\[SUMBER:/);
  const relevantSections = [];
  
  for (const section of sections) {
    const lowerSection = section.toLowerCase();
    
    // Cek apakah section ini relevan
    const isRelevant = keywords.some(keyword => lowerSection.includes(keyword));
    
    if (isRelevant) {
      relevantSections.push('[SUMBER:' + section);
    }
  }
  
  const result = relevantSections.join('\n\n');
  
  // Jika tidak ada yang relevan, return full KB (limited)
  return result.length > 100 ? result : knowledgeBase.slice(0, 15000);
}

/**
 * Generate jawaban dengan AI berdasarkan context yang sudah di-route
 * @param {string} question - Pertanyaan user
 * @param {string} relevantContext - Context yang sudah di-filter
 * @returns {Promise<string>} Jawaban
 */
export async function generateAccurateAnswer(question, relevantContext) {
  try {
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

ATURAN PENTING:
✅ Jawab pakai data EXACT dari knowledge base
✅ Kalau ada angka/tanggal/biaya, pakai yang PERSIS dari knowledge base
✅ Kalau info tidak ada, jujur bilang tidak tahu dan kasih kontak
✅ Jawab dengan natural, seperti ngobrol sama teman
✅ Pakai emoji yang sesuai (1-2 per paragraf, jangan berlebihan)
✅ Kalau user tanya biaya/jadwal, langsung kasih angka konkret

======== KNOWLEDGE BASE (FILTERED & RELEVANT) ========
${relevantContext}
================================================================

PERTANYAAN USER:
"${question}"

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
      messages: [{ role: "user", content: prompt }],
      model: GROQ_MODEL,
      temperature: 0.8, // Lebih tinggi untuk lebih creative & natural
      max_tokens: 1024,
    });

    return completion.choices[0].message.content;

  } catch (err) {
    console.error("❌ Error generating answer:", err.message);
    throw err;
  }
}
