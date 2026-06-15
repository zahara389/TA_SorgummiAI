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

    // Alter column status to VARCHAR(50)
    console.log("Modifying status column to VARCHAR(50)...");
    await connection.query("ALTER TABLE faq MODIFY COLUMN status VARCHAR(50) DEFAULT 'Active'");

    // Add category column if it does not exist
    const [cols] = await connection.query("SHOW COLUMNS FROM faq LIKE 'category'");
    if (cols.length === 0) {
      console.log("Adding category column to faq table...");
      await connection.query("ALTER TABLE faq ADD COLUMN category VARCHAR(100) DEFAULT 'Umum'");
    } else {
      console.log("Category column already exists.");
    }

    // Convert any contact message status and category
    // Contact messages start with [Pesan dari ...
    console.log("Updating contact messages category and status...");
    await connection.query("UPDATE faq SET category = 'Kontak' WHERE question LIKE '[Pesan dari %'");
    await connection.query("UPDATE faq SET status = 'UNREAD' WHERE status = 'BELUM'");
    await connection.query("UPDATE faq SET status = 'REPLIED' WHERE status = 'TERJAWAB' AND category = 'Kontak'");

    console.log("FAQ schema update completed successfully!");
    await connection.end();
  } catch (err) {
    console.error("Error updating FAQ schema:", err);
  }
})();
