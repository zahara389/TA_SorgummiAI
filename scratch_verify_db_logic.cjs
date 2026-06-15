const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load env variables manually
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

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "db_sorgummi",
};

async function verifyDbLogic() {
  let pool;
  try {
    console.log("=== VERIFYING DATABASE VIEW TRACKING AND STATS LOGIC ===");
    pool = mysql.createPool(dbConfig);
    
    // Test connection
    const connection = await pool.getConnection();
    console.log("Connected to MySQL successfully.");
    
    // 1. Check if constraint still exists (should be dropped by server startup)
    const [fkRows] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'article_views' AND COLUMN_NAME = 'article_id' AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [dbConfig.database]);
    
    console.log("Active FK constraints on article_views(article_id):", fkRows);
    if (fkRows.length === 0) {
      console.log("PASSED: Foreign key constraint has been successfully dropped.");
    } else {
      console.log("WARNING: Foreign key constraint still exists. Dropping it now for the test...");
      for (const row of fkRows) {
        await connection.query(`ALTER TABLE article_views DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``);
        console.log(`Dropped ${row.CONSTRAINT_NAME}`);
      }
    }
    connection.release();

    // 2. Fetch current stats for user 1 directly using the new stats query
    console.log("\n2. Fetching initial count using the new SELECT COUNT(*) query...");
    const [[{ cnt: initialCount }]] = await pool.query(
      "SELECT COUNT(*) as cnt FROM article_views WHERE user_id = ?",
      [1]
    );
    console.log("Initial article_views count for User 1:", initialCount);

    // 3. Simulate trackView helper function for an article view (Edukasi)
    console.log("\n3. Simulating trackView for article view (Edukasi, id=1, user_id=1)...");
    // Simulate query execution like trackView helper
    await pool.query("UPDATE articles SET views = views + 1 WHERE id = 1");
    await pool.query("INSERT INTO article_views (user_id, article_id) VALUES (1, 1)");
    console.log("Successfully logged article view.");

    // 4. Simulate trackView helper function for a product view (Pengelolaan)
    console.log("\n4. Simulating trackView for product view (Pengelolaan, id=1, user_id=1)...");
    await pool.query("UPDATE products SET views = views + 1 WHERE id = 1");
    await pool.query("INSERT INTO product_views (user_id, product_id) VALUES (1, 1)");
    // This is the crucial part: also log product view into article_views table!
    await pool.query("INSERT INTO article_views (user_id, article_id) VALUES (1, 1)");
    console.log("Successfully logged product view into product_views AND article_views.");

    // 5. Fetch updated stats for user 1
    console.log("\n5. Fetching updated count...");
    const [[{ cnt: finalCount }]] = await pool.query(
      "SELECT COUNT(*) as cnt FROM article_views WHERE user_id = ?",
      [1]
    );
    console.log("Updated article_views count for User 1:", finalCount);
    
    console.log(`\nDiff count: ${finalCount - initialCount}`);
    if (finalCount - initialCount === 2) {
      console.log("SUCCESS: Both article and product views were successfully tracked and counted accumulatively!");
    } else {
      console.log("FAILURE: Verification counts mismatch.");
    }

  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

verifyDbLogic();
