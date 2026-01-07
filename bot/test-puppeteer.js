// Test Puppeteer scraping
import { scrapeSPA } from "./scraper-puppeteer.js";

console.log("🚀 Testing Puppeteer Scraping...\n");

const url = "https://smkglobin.lovable.app/ppdb";

console.log("Target:", url);
console.log("Launching browser...\n");

const content = await scrapeSPA(url, 3000);

if (content) {
  console.log("\n✅ Scraping berhasil!");
  console.log("📏 Panjang content:", content.length);
  console.log("\n📄 Preview (500 karakter pertama):");
  console.log("-".repeat(60));
  console.log(content.slice(0, 500));
  console.log("-".repeat(60));
  
  // Cek konten penting
  console.log("\n🔍 Checking important content:");
  console.log("- Contains 'Gelombang':", content.includes('Gelombang') ? "✅" : "❌");
  console.log("- Contains '500.000':", content.includes('500.000') ? "✅" : "❌");
  console.log("- Contains 'JALUR PENDAFTARAN':", content.includes('JALUR PENDAFTARAN') ? "✅" : "❌");
  console.log("- Contains 'Pendaftaran PPDB':", content.includes('Pendaftaran PPDB') ? "✅" : "❌");
  console.log("- Contains 'Tahapan':", content.includes('Tahapan') || content.includes('TAHAPAN') ? "✅" : "❌");
  
} else {
  console.log("\n❌ Scraping gagal!");
}
