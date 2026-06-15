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
    const dbFile = path.resolve(process.cwd(), "db.json");
    if (!fs.existsSync(dbFile)) {
      console.error("db.json not found!");
      return;
    }
    const db = JSON.parse(fs.readFileSync(dbFile, "utf-8"));
    const dbUsers = db.users || [];

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "db_sorgummi",
    });

    console.log("Connected to MySQL.");

    // Get all existing emails in MySQL to avoid duplicates
    const [sqlUsers] = await connection.query("SELECT email FROM users");
    const sqlEmails = new Set(sqlUsers.map(u => String(u.email).toLowerCase()));

    let importedCount = 0;
    for (const u of dbUsers) {
      const emailLower = String(u.email).toLowerCase();
      if (!sqlEmails.has(emailLower)) {
        console.log(`Syncing user: ${u.name} (${u.email})`);
        
        // Insert user to MySQL users table
        await connection.query(
          "INSERT INTO users (name, email, password, role, photo, phone, location, bio, points, language, dark_mode, resetToken, resetExpires) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            u.name,
            u.email,
            u.password,
            u.role || "user",
            u.photo || u.avatar || "",
            u.phone || "",
            u.location || "",
            u.bio || null,
            u.points || 0,
            u.language || "id",
            u.dark_mode !== false,
            u.resetToken || null,
            u.resetExpires || null
          ]
        );
        importedCount++;
      } else {
        console.log(`User already exists, skipping: ${u.email}`);
      }
    }

    console.log(`Sync completed. Imported ${importedCount} users.`);
    
    const [finalCountRows] = await connection.query("SELECT COUNT(*) as cnt FROM users");
    console.log(`Total users in MySQL now: ${finalCountRows[0].cnt}`);

    await connection.end();
  } catch (err) {
    console.error("Sync error:", err);
  }
})();
