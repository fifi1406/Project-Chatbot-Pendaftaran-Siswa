// Test scraping PPDB
import axios from "axios";

const url = "https://smkglobin.lovable.app/ppdb";

console.log("🌐 Testing fetch:", url);

try {
  const { data } = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
    },
  });

  console.log("\n✅ Fetch berhasil!");
  console.log("📏 Panjang HTML:", data.length);
  console.log("\n📄 Preview HTML (500 karakter pertama):");
  console.log(data.slice(0, 500));
  console.log("\n...\n");
  
  // Cek apakah ada konten PPDB
  if (data.includes("PPDB") || data.includes("Pendaftaran")) {
    console.log("✅ Konten PPDB ditemukan!");
  } else {
    console.log("❌ Konten PPDB TIDAK ditemukan!");
  }

  // Cek apakah ini SPA (Single Page Application)
  if (data.includes("__NEXT_DATA__") || data.includes("root") && data.length < 5000) {
    console.log("\n⚠️  WARNING: Ini sepertinya SPA (React/Next.js)");
    console.log("    Data konten di-load via JavaScript, bukan di HTML awal");
    console.log("    Perlu gunakan puppeteer/playwright untuk scraping!");
  }

} catch (err) {
  console.error("❌ Error:", err.message);
}
