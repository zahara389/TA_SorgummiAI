const path = require('path');
const fs = require('fs');

(function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let val = match[2].trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
    });
  }
})();

const port = process.env.PORT || 3000;

(async () => {
  try {
    const response = await fetch(`http://localhost:${port}/api/articles/index.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Artikel Baru",
        content: "Ini konten artikel tes.",
        category: "Masalah Tanah",
        status: "Published",
        author: "Admin",
        readTime: "5 menit",
        badge: "Hot",
        stepTitle: "Langkah-langkah",
        problem: "Masalah tanah",
        cause: "Penyebab tanah",
        solutions: ["Solusi 1", "Solusi 2"],
        expertTips: "Tips Ahli",
        thumbnail: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      }),
    });
    
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response Body:", text);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
})();
