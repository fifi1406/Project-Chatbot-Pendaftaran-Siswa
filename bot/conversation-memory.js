// bot/conversation-memory.js - Conversation Memory System
import fs from 'fs';
import path from 'path';

// Folder untuk menyimpan conversation history
const CONVERSATION_DIR = path.join(process.cwd(), 'conversations');

// Pastikan folder exists
if (!fs.existsSync(CONVERSATION_DIR)) {
  fs.mkdirSync(CONVERSATION_DIR, { recursive: true });
  console.log('📁 Created conversations directory');
}

// In-memory cache untuk performa
const conversationCache = new Map();

/**
 * Get conversation history untuk user
 * @param {string} userId - WhatsApp number
 * @param {number} limit - Max messages to return
 * @returns {Array} Array of messages
 */
export function getConversationHistory(userId, limit = 10) {
  // Cek cache dulu
  if (conversationCache.has(userId)) {
    const cached = conversationCache.get(userId);
    return cached.slice(-limit);
  }
  
  // Load from file
  const filePath = path.join(CONVERSATION_DIR, `${sanitizeUserId(userId)}.json`);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const history = JSON.parse(data);
    
    // Update cache
    conversationCache.set(userId, history);
    
    return history.slice(-limit);
  } catch (err) {
    console.error(`❌ Error loading conversation for ${userId}:`, err.message);
    return [];
  }
}

/**
 * Save message to conversation history
 * @param {string} userId - WhatsApp number
 * @param {string} role - 'user' or 'bot'
 * @param {string} message - Message content
 * @param {Object} metadata - Additional metadata
 */
export function saveMessage(userId, role, message, metadata = {}) {
  try {
    // Get existing history
    let history = conversationCache.get(userId) || getConversationHistory(userId, 1000);
    
    // Add new message
    const newMessage = {
      role,
      message,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    history.push(newMessage);
    
    // Keep only last 100 messages per user (untuk hemat storage)
    if (history.length > 100) {
      history = history.slice(-100);
    }
    
    // Update cache
    conversationCache.set(userId, history);
    
    // Save to file (async, non-blocking)
    const filePath = path.join(CONVERSATION_DIR, `${sanitizeUserId(userId)}.json`);
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
    
  } catch (err) {
    console.error(`❌ Error saving message for ${userId}:`, err.message);
  }
}

/**
 * Format conversation history untuk AI context
 * @param {string} userId - WhatsApp number
 * @param {number} limit - Max messages to include
 * @returns {string} Formatted conversation history
 */
export function formatConversationForAI(userId, limit = 5) {
  const history = getConversationHistory(userId, limit);
  
  if (history.length === 0) {
    return '';
  }
  
  let formatted = '\n\n========== RIWAYAT PERCAKAPAN ==========\n';
  
  for (const msg of history) {
    const time = new Date(msg.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (msg.role === 'user') {
      formatted += `[${time}] User: ${msg.message}\n`;
    } else {
      formatted += `[${time}] Bot: ${msg.message.slice(0, 100)}${msg.message.length > 100 ? '...' : ''}\n`;
    }
  }
  
  formatted += '==========================================\n\n';
  
  return formatted;
}

/**
 * Get conversation summary untuk user
 * @param {string} userId - WhatsApp number
 * @returns {Object} Summary statistics
 */
export function getConversationSummary(userId) {
  const history = getConversationHistory(userId, 1000);
  
  if (history.length === 0) {
    return {
      totalMessages: 0,
      userMessages: 0,
      botMessages: 0,
      firstMessage: null,
      lastMessage: null,
      isNewUser: true
    };
  }
  
  const userMessages = history.filter(m => m.role === 'user').length;
  const botMessages = history.filter(m => m.role === 'bot').length;
  
  return {
    totalMessages: history.length,
    userMessages,
    botMessages,
    firstMessage: history[0],
    lastMessage: history[history.length - 1],
    isNewUser: false
  };
}

/**
 * Clear conversation history untuk user
 * @param {string} userId - WhatsApp number
 */
export function clearConversationHistory(userId) {
  try {
    // Remove from cache
    conversationCache.delete(userId);
    
    // Remove file
    const filePath = path.join(CONVERSATION_DIR, `${sanitizeUserId(userId)}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Cleared conversation history for ${userId}`);
    }
  } catch (err) {
    console.error(`❌ Error clearing conversation for ${userId}:`, err.message);
  }
}

/**
 * Get all users with conversation history
 * @returns {Array} Array of user IDs
 */
export function getAllUsers() {
  try {
    const files = fs.readdirSync(CONVERSATION_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch (err) {
    console.error('❌ Error getting users:', err.message);
    return [];
  }
}

/**
 * Get conversation stats untuk semua user
 * @returns {Object} Global statistics
 */
export function getGlobalStats() {
  const users = getAllUsers();
  
  let totalMessages = 0;
  let totalUsers = users.length;
  let activeToday = 0;
  
  const today = new Date().toDateString();
  
  for (const userId of users) {
    const history = getConversationHistory(userId, 1000);
    totalMessages += history.length;
    
    // Check if user active today
    const lastMsg = history[history.length - 1];
    if (lastMsg && new Date(lastMsg.timestamp).toDateString() === today) {
      activeToday++;
    }
  }
  
  return {
    totalUsers,
    totalMessages,
    activeToday,
    avgMessagesPerUser: totalUsers > 0 ? (totalMessages / totalUsers).toFixed(1) : 0
  };
}

/**
 * Sanitize user ID untuk filename
 * @param {string} userId - WhatsApp number
 * @returns {string} Safe filename
 */
function sanitizeUserId(userId) {
  return userId.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Check if user is returning (has previous conversation)
 * @param {string} userId - WhatsApp number
 * @returns {boolean}
 */
export function isReturningUser(userId) {
  const summary = getConversationSummary(userId);
  return !summary.isNewUser && summary.totalMessages > 0;
}

/**
 * Get last conversation time
 * @param {string} userId - WhatsApp number
 * @returns {string|null} Time since last message
 */
export function getLastConversationTime(userId) {
  const summary = getConversationSummary(userId);
  
  if (!summary.lastMessage) {
    return null;
  }
  
  const lastTime = new Date(summary.lastMessage.timestamp);
  const now = new Date();
  const diffMs = now - lastTime;
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'baru saja';
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  return `${diffDays} hari yang lalu`;
}

// Export all functions
export default {
  getConversationHistory,
  saveMessage,
  formatConversationForAI,
  getConversationSummary,
  clearConversationHistory,
  getAllUsers,
  getGlobalStats,
  isReturningUser,
  getLastConversationTime
};
