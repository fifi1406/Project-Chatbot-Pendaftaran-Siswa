// bot/test-all-pages.js - Test All Pages Scraping
import axios from "axios";
import { scrapeSPA } from "./scraper-puppeteer.js";

const PAGES = [
  { url: "https://smkglobin.lovable.app/", name: "Home" },
  { url: "https://smkglobin.lovable.app/profil", name: "Profil" },
  { url: "https://smkglobin.lovable.app/jurusan", name: "Jurusan" },
  { url: "https://smkglobin.lovable.app/ekstrakurikuler", name: "Ekstrakurikuler" },
  { url: "https://smkglobin.lovable.app/berita", name: "Berita" },
  { url: "https://smkglobin.lovable.app/galeri", name: "Galeri" },
  { url: "https://smkglobin.lovable.app/statistik", name: "Statistik" },
  { url: "https://smkglobin.lovable.app/guru", name: "Guru" },
  { url: "https://smkglobin.lovable.app/ppdb", name: "PPDB" },
  { url: "https://smkglobin.lovable.app/kontak", name: "Kontak" },
  { url: "https://smkglobin.lovable.app/fasilitas", name: "Fasilitas" },
];

console.log("🧪 Testing All Pages Scraping\n");
console.log("=".repeat(60));

async function testAllPages() {
  const results = [];
  
  for (const page of PAGES) {
    console.log(`\n📄 Testing: ${page.name} (${page.url})`);
    console.log("-".repeat(60));
    
    try {
      // Test dengan axios dulu
      const { data } = await axios.get(page.url, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
        },
      });
      
      const htmlLength = data.length;
      const hasContent = data.includes('SMK GLOBIN') || data.includes('Bogor');
      
      // Cek apakah konten cukup (> 500 chars berarti ada konten)
      const needsPuppeteer = htmlLength < 500 || !hasContent;
      
      console.log(`   Axios: ${htmlLength} chars`);
      console.log(`   Has content: ${hasContent ? 'Yes' : 'No'}`);
      console.log(`   Needs Puppeteer: ${needsPuppeteer ? 'YES ⚠️' : 'No ✅'}`);
      
      if (needsPuppeteer) {
        console.log(`   🚀 Testing with Puppeteer...`);
        const content = await scrapeSPA(page.url, 3000);
        console.log(`   Puppeteer: ${content.length} chars`);
        
        results.push({
          name: page.name,
          url: page.url,
          method: 'Puppeteer',
          length: content.length,
          success: content.length > 100
        });
      } else {
        results.push({
          name: page.name,
          url: page.url,
          method: 'Axios',
          length: htmlLength,
          success: true
        });
      }
      
      // Delay untuk avoid overload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      results.push({
        name: page.name,
        url: page.url,
        method: 'Failed',
        length: 0,
        success: false
      });
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  
  const puppeteerPages = results.filter(r => r.method === 'Puppeteer');
  const axiosPages = results.filter(r => r.method === 'Axios');
  const failedPages = results.filter(r => !r.success);
  
  console.log(`\n✅ Success: ${results.filter(r => r.success).length}/${results.length}`);
  console.log(`🚀 Needs Puppeteer: ${puppeteerPages.length}`);
  console.log(`⚡ Can use Axios: ${axiosPages.length}`);
  console.log(`❌ Failed: ${failedPages.length}`);
  
  if (puppeteerPages.length > 0) {
    console.log(`\n🚀 Pages that need Puppeteer:`);
    for (const page of puppeteerPages) {
      console.log(`   - ${page.name} (${page.length} chars)`);
    }
  }
  
  if (failedPages.length > 0) {
    console.log(`\n❌ Failed pages:`);
    for (const page of failedPages) {
      console.log(`   - ${page.name}`);
    }
  }
  
  console.log("\n💡 Recommendation:");
  console.log("   Update PUPPETEER_PAGES in bot/rag-groq.js:");
  console.log(`   const PUPPETEER_PAGES = [${puppeteerPages.map(p => `'/${p.name.toLowerCase()}'`).join(', ')}];`);
}

testAllPages();
