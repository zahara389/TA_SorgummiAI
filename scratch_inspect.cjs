const mysql = require('mysql2/promise');
// Load environment variables manually to be safe
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

    const [tables] = await connection.query("SHOW TABLES");
    console.log("Tables in database:", tables);

    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
      console.log(`\nTable: ${tableName}`);
      console.log(columns.map(c => `${c.Field}: ${c.Type} (${c.Null}, ${c.Key})`));
    }

    await connection.end();
  } catch (err) {
    console.error("Error inspecting database:", err);
  }
})();
