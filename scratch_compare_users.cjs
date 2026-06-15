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
    const db = JSON.parse(fs.readFileSync(dbFile, "utf-8"));
    const dbUsers = db.users || [];
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "db_sorgummi",
    });

    const [sqlUsers] = await connection.query("SELECT id, name, email, role FROM users");
    
    console.log("--- Users in db.json (count:", dbUsers.length, ") ---");
    dbUsers.forEach(u => console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`));

    console.log("\n--- Users in MySQL (count:", sqlUsers.length, ") ---");
    // Print first 15 or so
    sqlUsers.slice(0, 15).forEach(u => console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`));
    if (sqlUsers.length > 15) {
      console.log(`... and ${sqlUsers.length - 15} more`);
    }

    console.log("\n--- Users in db.json but NOT in MySQL ---");
    const sqlEmails = new Set(sqlUsers.map(u => String(u.email).toLowerCase()));
    dbUsers.forEach(u => {
      if (!sqlEmails.has(String(u.email).toLowerCase())) {
        console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
      }
    });

    await connection.end();
  } catch (err) {
    console.error("Error:", err);
  }
})();
