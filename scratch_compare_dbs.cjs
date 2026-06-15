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
    // 1. Read db.json
    const dbFile = path.resolve(process.cwd(), "db.json");
    const db = JSON.parse(fs.readFileSync(dbFile, "utf-8"));
    console.log("=== DB.JSON STATUS ===");
    console.log("users count in db.json:", db.users ? db.users.length : 0);
    console.log("chat_logs count in db.json:", db.chat_logs ? db.chat_logs.length : 0);
    console.log("articles count in db.json:", db.articles ? db.articles.length : 0);
    console.log("products count in db.json:", db.products ? db.products.length : 0);
    console.log("feedback count in db.json:", db.feedback ? db.feedback.length : 0);
    console.log("activity_logs count in db.json:", db.activity_logs ? db.activity_logs.length : 0);
    console.log("article_views count in db.json:", db.article_views ? db.article_views.length : 0);
    console.log("product_views count in db.json:", db.product_views ? db.product_views.length : 0);

    // 2. Read MySQL
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "db_sorgummi",
    });
    console.log("\n=== MYSQL DATABASE STATUS ===");
    
    const [users] = await connection.query("SELECT COUNT(*) as cnt FROM users");
    console.log("users count in MySQL:", users[0].cnt);

    const [chatLogs] = await connection.query("SELECT COUNT(*) as cnt FROM chat_logs");
    console.log("chat_logs count in MySQL:", chatLogs[0].cnt);

    const [articles] = await connection.query("SELECT COUNT(*) as cnt FROM articles");
    console.log("articles count in MySQL:", articles[0].cnt);

    const [products] = await connection.query("SELECT COUNT(*) as cnt FROM products");
    console.log("products count in MySQL:", products[0].cnt);

    const [feedback] = await connection.query("SELECT COUNT(*) as cnt FROM feedback");
    console.log("feedback count in MySQL:", feedback[0].cnt);

    await connection.end();
  } catch (err) {
    console.error("Error:", err);
  }
})();
