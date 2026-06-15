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

    // Let's print one article to know its schema / format
    const [articles] = await connection.query("SELECT * FROM articles LIMIT 1");
    console.log("Original article sample:", articles[0]);

    if (articles.length > 0) {
      const art = articles[0];
      const id = art.id;
      // Let's test the update statement like server.ts does:
      const query = "UPDATE articles SET title = ?, solutions = ? WHERE id = ?";
      const params = ["Test Title Updated", JSON.stringify(["sol 1", "sol 2"]), id];
      console.log("Running query:", query, "with params:", params);
      const [result] = await connection.query(query, params);
      console.log("Result:", result);
    }

    await connection.end();
  } catch (err) {
    console.error("Error running query:", err);
  }
})();
