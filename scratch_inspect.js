const mysql = require('mysql2/promise');
require('dotenv').config(); // if any

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
