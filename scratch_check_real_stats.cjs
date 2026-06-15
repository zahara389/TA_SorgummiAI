const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
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

    console.log("Connected successfully.");

    const [[{ cnt: totalSessions }]] = await connection.query("SELECT COUNT(DISTINCT session_id) as cnt FROM chat_messages");
    const [[{ cnt: totalNotifications }]] = await connection.query("SELECT COUNT(*) as cnt FROM notifications");
    const [[{ cnt: totalArticles }]] = await connection.query("SELECT COUNT(*) as cnt FROM articles");
    const [[{ cnt: totalChats }]] = await connection.query("SELECT COUNT(*) as cnt FROM chat_messages WHERE sender = 'bot'");
    const [[{ cnt: totalUsers }]] = await connection.query("SELECT COUNT(*) as cnt FROM users");

    console.log("\nActual Database Stats:");
    console.log(`- totalSessions: ${totalSessions}`);
    console.log(`- totalNotifications: ${totalNotifications}`);
    console.log(`- totalArticles: ${totalArticles}`);
    console.log(`- totalMateri (notif + articles): ${(totalNotifications || 0) + (totalArticles || 0)}`);
    console.log(`- totalChats (bot): ${totalChats}`);
    console.log(`- totalUsers: ${totalUsers}`);

    await connection.end();
  } catch (err) {
    console.error("Error:", err);
  }
})();
