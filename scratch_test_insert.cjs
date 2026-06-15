const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "db_sorgummi",
    });
    console.log("Connected to MySQL successfully.");

    // Let's mock a POST body and run the query
    const body = {
      title: "Cara Menanam Sorgum",
      content: "Langkah-langkah menanam sorgum...",
      category: "Masalah Tanah",
      status: "Published",
      author: "Admin",
      readTime: "5 Menit",
      badge: "Solusi Baru",
      stepTitle: "Langkah Penyelamatan",
      problem: "Masalah tanah kering",
      cause: "Kurang air",
      solutions: ["Langkah 1", "Langkah 2"],
      expertTips: "Tips ahli",
      thumbnail: "data:image/jpeg;base64,..."
    };

    const { title, content, category, bannerUrl, image, thumbnail, description, duration, totalMateri, status, author, readTime } = body;
    const imgUrl = image || bannerUrl || "";
    const thumbUrl = thumbnail || imgUrl;

    const [result] = await connection.query(
      "INSERT INTO articles (title, content, category, image, thumbnail, description, duration, totalMateri, status, author, readTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        title || "",
        content || "",
        category || "",
        imgUrl,
        thumbUrl,
        description || "",
        duration || "",
        totalMateri || 0,
        status || "Published",
        author || "",
        readTime || "",
      ]
    );

    console.log("Insert success!", result);
    await connection.end();
  } catch (err) {
    console.error("Error executing query:", err);
  }
})();
