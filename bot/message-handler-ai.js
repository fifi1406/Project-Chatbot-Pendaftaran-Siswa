// bot/message-handler-ai.js - AI-Powered Message Handler
import { detectIntentWithAI, routeToKnowledgeSource, generateAccurateAnswer } from "./ai-intent-router.js";
import { formatConversationForAI } from "./conversation-memory.js";

// Import fallback function
import { fallbackIntentDetection } from "./ai-intent-router.js";

// Simpan knowledge base di memory
let knowledgeBaseCache = null;

/**
 * Set knowledge base cache
 */
export function setKnowledgeBase(kb) {
  knowledgeBaseCache = kb;
}

/**
 * Get knowledge base
 */
function getKnowledgeBase() {
  return knowledgeBaseCache || "";
}

/**
 * Handle pesan dengan AI-powered system
 * @param {string} rawText - Pesan dari user
 * @param {Object} userState - State user saat ini
 * @param {Function} sock - WhatsApp socket
 * @param {string} sender - Nomor pengirim
 * @param {boolean} useAI - Apakah boleh gunakan AI (rate limit check)
 * @returns {Promise<Object>} { handled, shouldContinueToForm, aiUsed, responseText }
 */
export async function handleMessageWithAI(rawText, userState, sock, sender, useAI = true) {
  try {
    const isInRegistration = !!userState?.step;
    
    // Get conversation history untuk context
    const conversationContext = formatConversationForAI(sender, 5);
    
    // Deteksi intent dengan AI (jika allowed)
    console.log(`\n🤖 Analyzing message: "${rawText}"`);
    
    if (conversationContext) {
      console.log(`💭 Using conversation history (last 5 messages)`);
    }
    
    let intentResult;
    
    if (useAI) {
      intentResult = await detectIntentWithAI(rawText, isInRegistration);
    } else {
      // Langsung gunakan fallback jika rate limit
      console.log('⚠️  Using fallback intent detection (rate limit)');
      intentResult = fallbackIntentDetection(rawText, isInRegistration);
    }
    
    const aiUsed = useAI && !intentResult.reasoning?.includes('Fallback');
    
    console.log(`🎯 Intent: ${intentResult.intent} (${(intentResult.confidence * 100).toFixed(0)}%)`);
    console.log(`💡 Reasoning: ${intentResult.reasoning}`);
    
    // ========== HANDLE: CANCEL ==========
    if (intentResult.intent === 'CANCEL' && isInRegistration) {
      console.log('✅ Handling CANCEL intent');
      
      return {
        handled: true,
        shouldContinueToForm: false,
        aiUsed,
        action: async () => {
          await sock.sendMessage(sender, {
            text: '❌ *Pendaftaran Dibatalkan*\n\n' +
                  'Oke deh, gak papa kok! Kamu bisa daftar kapan aja kalau udah siap 😊\n\n' +
                  '💡 Ketik *Daftar* kalau mau mulai lagi\n' +
                  '💡 Ketik *Bantuan* kalau butuh bantuan\n\n' +
                  'Ada yang mau aku bantu lagi? 🙌'
          });
        }
      };
    }
    
    // ========== HANDLE: CONTINUE ==========
    if (intentResult.intent === 'CONTINUE' && isInRegistration) {
      console.log('✅ Handling CONTINUE intent');
      
      const step = userState.step;
      const stepMessages = {
        1: '📝 Silakan masukkan *nama lengkap* Anda:',
        2: '📧 Masukkan *alamat email* Anda:',
        3: '📱 Masukkan *nomor HP* (contoh: 081234567890):',
        4: '🏠 Masukkan *tempat lahir*:',
        5: '📅 Masukkan *tanggal lahir* (format: YYYY-MM-DD, contoh: 2005-05-15):',
        6: '🚻 Masukkan *jenis kelamin* (L/P):',
        7: '🕌 Masukkan *agama*:',
        8: '🏠 Masukkan *alamat lengkap*:',
        9: '👨‍👩‍👧‍👦 Masukkan *nama orang tua*:',
        10: '💼 Masukkan *pekerjaan orang tua*:',
        11: '📱 Masukkan *nomor HP orang tua* (contoh: 081234567890):',
        12: '🏫 Masukkan *asal sekolah*:',
        13: '🏫 Masukkan *alamat sekolah asal*:',
        14: '📅 Masukkan *tahun lulus* (contoh: 2024):',
        15: '📊 Masukkan *nilai raport* (contoh: 85.50):',
        16: '🎓 Pilih *jurusan* yang diminati:\n\n1. Manajemen Perkantoran dan Layanan Bisnis\n2. Akuntansi dan Keuangan Lembaga\n3. Pemasaran\n\nBalas dengan nomor (1/2/3):'
      };
      
      return {
        handled: true,
        shouldContinueToForm: false,
        aiUsed,
        action: async () => {
          await sock.sendMessage(sender, {
            text: '✅ Oke gas! Yuk kita lanjutin pendaftarannya 😊\n\n' + 
                  (stepMessages[step] || 'Lanjut ya...')
          });
        }
      };
    }
    
    // ========== HANDLE: QUESTION (di tengah pendaftaran) ==========
    if (intentResult.intent === 'QUESTION' && isInRegistration) {
      console.log('✅ Handling QUESTION intent (during registration)');
      
      const currentStep = userState.step;
      const kb = getKnowledgeBase();
      
      let answer;
      
      if (useAI) {
        // Route ke knowledge source yang tepat
        console.log('🎯 Routing to knowledge source...');
        const routing = await routeToKnowledgeSource(rawText, kb);
        
        console.log(`📚 Using source: ${routing.source} (${(routing.confidence * 100).toFixed(0)}%)`);
        
        // Generate jawaban akurat
        answer = await generateAccurateAnswer(rawText, routing.relevantContext);
      } else {
        // Fallback: gunakan RAG biasa
        const { answerDenganGemini } = await import('./rag-groq.js');
        answer = await answerDenganGemini(rawText);
      }
      
      return {
        handled: true,
        shouldContinueToForm: false,
        aiUsed: useAI,
        action: async () => {
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
        }
      };
    }
    
    // ========== HANDLE: REGISTER ==========
    if (intentResult.intent === 'REGISTER' && !isInRegistration) {
      console.log('✅ Handling REGISTER intent');
      
      return {
        handled: true,
        shouldContinueToForm: false,
        aiUsed,
        action: async () => {
          await sock.sendMessage(sender, {
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
        },
        shouldStartRegistration: true
      };
    }
    
    // ========== HANDLE: GREETING ==========
    if (intentResult.intent === 'GREETING') {
      console.log('✅ Handling GREETING intent');
      
      return {
        handled: true,
        shouldContinueToForm: false,
        aiUsed,
        action: async () => {
          await sock.sendMessage(sender, {
            text: '👋 Halo! Seneng banget bisa kenalan sama kamu!\n\n' +
                  'Aku GLOMIN, asisten virtual SMK Globin Bogor. Aku di sini buat bantu kamu kok 😊\n\n' +
                  '💡 Kamu bisa:\n' +
                  '• Ketik *Daftar* kalau mau daftar jadi siswa baru\n' +
                  '• Tanya-tanya soal sekolah, jurusan, biaya, dll\n' +
                  '• Ketik *Bantuan* kalau butuh panduan\n\n' +
                  'Ada yang mau kamu tanyain? Aku siap bantu! 🙌'
          });
        }
      };
    }
    
    // ========== HANDLE: QUESTION (tidak dalam pendaftaran) ==========
    if (intentResult.intent === 'QUESTION' && !isInRegistration) {
      console.log('✅ Handling QUESTION intent (general)');
      
      const kb = getKnowledgeBase();
      
      let answer;
      
      if (useAI) {
        // Route ke knowledge source yang tepat
        console.log('🎯 Routing to knowledge source...');
        const routing = await routeToKnowledgeSource(rawText, kb);
        
        console.log(`📚 Using source: ${routing.source} (${(routing.confidence * 100).toFixed(0)}%)`);
        
        // Generate jawaban akurat
        answer = await generateAccurateAnswer(rawText, routing.relevantContext);
      } else {
        // Fallback: gunakan RAG biasa
        const { answerDenganGemini } = await import('./rag-groq.js');
        answer = await answerDenganGemini(rawText);
      }
      
      return {
        handled: true,
        shouldContinueToForm: false,
        aiUsed: useAI,
        action: async () => {
          await sock.sendMessage(sender, { text: answer });
        }
      };
    }
    
    // ========== HANDLE: ANSWER (user menjawab form) ==========
    if (intentResult.intent === 'ANSWER' && isInRegistration) {
      console.log('✅ Detected ANSWER intent - continuing to form processing');
      
      // Lanjutkan ke form processing
      return {
        handled: false,
        shouldContinueToForm: true,
        aiUsed
      };
    }
    
    // ========== DEFAULT: Lanjutkan ke form atau jawab dengan AI ==========
    console.log('⚠️ No specific intent matched, using default behavior');
    
    if (isInRegistration) {
      // Jika dalam pendaftaran, anggap sebagai jawaban form
      return {
        handled: false,
        shouldContinueToForm: true,
        aiUsed: false
      };
    } else {
      // Jika tidak dalam pendaftaran, jawab dengan AI
      const kb = getKnowledgeBase();
      
      let answer;
      
      if (useAI) {
        const routing = await routeToKnowledgeSource(rawText, kb);
        answer = await generateAccurateAnswer(rawText, routing.relevantContext);
      } else {
        const { answerDenganGemini } = await import('./rag-groq.js');
        answer = await answerDenganGemini(rawText);
      }
      
      return {
        handled: true,
        shouldContinueToForm: false,
        aiUsed: useAI,
        action: async () => {
          await sock.sendMessage(sender, { text: answer });
        }
      };
    }
    
  } catch (err) {
    console.error('❌ Error in AI message handler:', err);
    
    // Fallback: lanjutkan ke form processing atau error message
    return {
      handled: false,
      shouldContinueToForm: !!userState?.step,
      aiUsed: false,
      error: err
    };
  }
}
