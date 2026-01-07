// bot/test-guru-page.js - Test Guru Page Scraping
import { scrapeSPA } from "./scraper-puppeteer.js";

console.log("🧪 Testing Guru Page with Puppeteer\n");

async function testGuruPage() {
  try {
    console.log("🚀 Scraping: https://smkglobin.lovable.app/guru");
    console.log("-".repeat(60));
    
    const content = await scrapeSPA("https://smkglobin.lovable.app/guru", 3000);
    
    console.log(`\n✅ Scraped successfully!`);
    console.log(`📏 Content length: ${content.length} chars`);
    console.log(`\n📄 Content preview (first 500 chars):`);
    console.log("-".repeat(60));
    console.log(content.slice(0, 500));
    console.log("-".repeat(60));
    
    // Check for guru-related keywords
    const hasGuruInfo = content.toLowerCase().includes('guru') || 
                        content.toLowerCase().includes('pengajar') ||
                        content.toLowerCase().includes('tenaga pendidik');
    
    console.log(`\n🔍 Has guru information: ${hasGuruInfo ? 'YES ✅' : 'NO ❌'}`);
    
    if (hasGuruInfo) {
      console.log(`\n🎉 Guru page scraping successful!`);
    } else {
      console.log(`\n⚠️  Guru page might need longer wait time or different selector`);
    }
    
  } catch (err) {
    console.error(`\n❌ Error:`, err.message);
  }
}

testGuruPage();
