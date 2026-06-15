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

    // Alter VARCHAR to LONGTEXT for base64 storage
    console.log("Altering articles image and thumbnail columns to LONGTEXT...");
    await connection.query("ALTER TABLE articles MODIFY COLUMN image LONGTEXT NULL");
    await connection.query("ALTER TABLE articles MODIFY COLUMN thumbnail LONGTEXT NULL");

    console.log("Altering products image and thumbnail columns to LONGTEXT...");
    await connection.query("ALTER TABLE products MODIFY COLUMN image LONGTEXT NULL");
    await connection.query("ALTER TABLE products MODIFY COLUMN thumbnail LONGTEXT NULL");

    // Add missing columns to articles table
    const addColumn = async (table, column, DDL) => {
      const [cols] = await connection.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
      if (cols.length === 0) {
        await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${DDL}`);
        console.log(`Successfully added column ${column} to table ${table}`);
      } else {
        console.log(`Column ${column} already exists in table ${table}`);
      }
    };

    await addColumn("articles", "badge", "VARCHAR(100) DEFAULT ''");
    await addColumn("articles", "stepTitle", "VARCHAR(255) DEFAULT ''");
    await addColumn("articles", "problem", "TEXT NULL");
    await addColumn("articles", "cause", "TEXT NULL");
    await addColumn("articles", "solutions", "JSON NULL");
    await addColumn("articles", "expertTips", "TEXT NULL");

    console.log("Schema update completed successfully.");
    await connection.end();
  } catch (err) {
    console.error("Error updating schema:", err);
  }
})();
