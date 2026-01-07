// bot/scraper-puppeteer.js
import puppeteer from "puppeteer";

/**
 * Scrape halaman SPA menggunakan Puppeteer
 * @param {string} url - URL yang akan di-scrape
 * @param {number} waitTime - Waktu tunggu untuk konten load (ms) - default 5000 untuk full load
 * @returns {Promise<string>} - Text content dari halaman
 */
export async function scrapeSPA(url, waitTime = 5000) {
  let browser;
  
  try {
    console.log(`🌐 Launching browser for: ${url}`);
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security'
      ]
    });

    const page = await browser.newPage();
    
    // Set viewport untuk desktop
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate ke URL dengan wait sampai network idle
    console.log(`⏳ Loading page...`);
    await page.goto(url, {
      waitUntil: 'networkidle2', // Wait sampai tidak ada network activity
      timeout: 30000
    });

    // Tunggu konten load (lebih lama untuk SPA)
    console.log(`⏳ Waiting ${waitTime}ms for SPA content to render...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Wait untuk body element
    await page.waitForSelector('body', { timeout: 10000 });

    // Extract text content
    const content = await page.evaluate(() => {
      // Hapus script dan style tags
      const scripts = document.querySelectorAll('script, style, noscript, iframe');
      scripts.forEach(el => el.remove());
      
      // Ambil text dari body
      const text = document.body.innerText || document.body.textContent || '';
      
      // Clean up whitespace
      return text.replace(/\s+/g, ' ').trim();
    });

    console.log(`✅ Scraped ${url} - Length: ${content.length} chars`);
    
    await browser.close();
    return content;

  } catch (err) {
    console.error(`❌ Error scraping ${url}:`, err.message);
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        // Ignore close errors
      }
    }
    
    return '';
  }
}

/**
 * Scrape multiple URLs dengan Puppeteer
 * @param {string[]} urls - Array of URLs
 * @param {number} waitTime - Wait time per page
 * @returns {Promise<Object>} - Object dengan URL sebagai key dan content sebagai value
 */
export async function scrapeMultipleSPA(urls, waitTime = 3000) {
  const results = {};
  
  for (const url of urls) {
    const content = await scrapeSPA(url, waitTime);
    if (content) {
      results[url] = content;
    }
    
    // Delay antar request untuk avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}
