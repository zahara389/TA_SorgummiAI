const http = require('http');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables for DB connection
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

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

(async () => {
  const host = 'localhost';
  const port = 3000;
  const testUserId = 1; // Administrator user ID (guaranteed to exist in DB)
  const testUserEmail = 'admin123@gmail.com';

  console.log("Connecting to MySQL to prepare test state...");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "db_sorgummi",
  });

  try {
    // 1. Get target article ID
    const [articles] = await connection.query("SELECT id, title, helpful, notHelpful FROM articles LIMIT 1");
    if (articles.length === 0) {
      throw new Error("No articles found in DB to test with.");
    }
    const targetArticle = articles[0];
    const articleId = targetArticle.id;

    console.log(`\nCleaning up any existing feedback for user ${testUserId} on article ${articleId}...`);
    // Delete existing feedback to ensure clean test starting state
    const [existing] = await connection.query(
      "SELECT is_helpful FROM article_feedback WHERE article_id = ? AND user_id = ?",
      [articleId, testUserId]
    );

    if (existing.length > 0) {
      const wasHelpful = !!existing[0].is_helpful;
      await connection.query("DELETE FROM article_feedback WHERE article_id = ? AND user_id = ?", [articleId, testUserId]);
      if (wasHelpful) {
        await connection.query("UPDATE articles SET helpful = GREATEST(0, helpful - 1) WHERE id = ?", [articleId]);
      } else {
        await connection.query("UPDATE articles SET notHelpful = GREATEST(0, notHelpful - 1) WHERE id = ?", [articleId]);
      }
      console.log("Cleaned up existing feedback and adjusted counts.");
    }

    // Get fresh base counts from DB
    const [[freshArticle]] = await connection.query("SELECT helpful, notHelpful FROM articles WHERE id = ?", [articleId]);
    const initialHelpful = Number(freshArticle.helpful || 0);
    const initialNotHelpful = Number(freshArticle.notHelpful || 0);

    console.log(`\nInitial stats - Helpful: ${initialHelpful}, Not Helpful: ${initialNotHelpful}`);

    // --- TEST CASE A: First-time feedback insertion ---
    console.log("\n2. POST /api/articles/:id/feedback - Sending helpful feedback");
    const postFeedbackRes1 = await makeRequest({
      host,
      port,
      path: `/api/articles/${articleId}/feedback`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, {
      user_id: testUserId,
      user_email: testUserEmail,
      type: 'helpful'
    });

    console.log("POST Response:", postFeedbackRes1.body);
    const getArticlesRes2 = await makeRequest({
      host,
      port,
      path: '/api/articles',
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    const articleAfterHelpful = JSON.parse(getArticlesRes2.body).data.find(a => Number(a.id) === Number(articleId));
    console.log(`Stats after helpful: Helpful = ${articleAfterHelpful.helpful}, Not Helpful = ${articleAfterHelpful.notHelpful}`);
    if (Number(articleAfterHelpful.helpful) !== initialHelpful + 1) {
      throw new Error(`Expected helpful count to be ${initialHelpful + 1}, got ${articleAfterHelpful.helpful}`);
    }
    console.log("TEST CASE A (Feedback creation & increment) passed!");

    // --- TEST CASE B: Same feedback choice clicked again (cancellation) ---
    console.log("\n3. POST /api/articles/:id/feedback - Sending helpful feedback again (to cancel)");
    const postFeedbackRes2 = await makeRequest({
      host,
      port,
      path: `/api/articles/${articleId}/feedback`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, {
      user_id: testUserId,
      user_email: testUserEmail,
      type: 'helpful'
    });

    console.log("POST Response (Cancel):", postFeedbackRes2.body);
    const getArticlesRes3 = await makeRequest({
      host,
      port,
      path: '/api/articles',
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    const articleAfterCancel = JSON.parse(getArticlesRes3.body).data.find(a => Number(a.id) === Number(articleId));
    console.log(`Stats after cancel: Helpful = ${articleAfterCancel.helpful}, Not Helpful = ${articleAfterCancel.notHelpful}`);
    if (Number(articleAfterCancel.helpful) !== initialHelpful) {
      throw new Error(`Expected helpful count to be back to ${initialHelpful}, got ${articleAfterCancel.helpful}`);
    }
    console.log("TEST CASE B (Feedback cancellation & decrement) passed!");

    // --- TEST CASE C: Swapping feedback choice (helpful -> not_helpful) ---
    console.log("\n4. POST /api/articles/:id/feedback - Sending helpful feedback first");
    await makeRequest({
      host,
      port,
      path: `/api/articles/${articleId}/feedback`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, {
      user_id: testUserId,
      user_email: testUserEmail,
      type: 'helpful'
    });

    console.log("Sending opposite choice (not_helpful) to trigger swap");
    const postFeedbackRes3 = await makeRequest({
      host,
      port,
      path: `/api/articles/${articleId}/feedback`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, {
      user_id: testUserId,
      user_email: testUserEmail,
      type: 'not_helpful'
    });

    console.log("POST Response (Swap):", postFeedbackRes3.body);
    const getArticlesRes4 = await makeRequest({
      host,
      port,
      path: '/api/articles',
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    const articleAfterSwap = JSON.parse(getArticlesRes4.body).data.find(a => Number(a.id) === Number(articleId));
    console.log(`Stats after swap: Helpful = ${articleAfterSwap.helpful}, Not Helpful = ${articleAfterSwap.notHelpful}`);
    if (Number(articleAfterSwap.helpful) !== initialHelpful || Number(articleAfterSwap.notHelpful) !== initialNotHelpful + 1) {
      throw new Error(`Expected helpful = ${freshArticle.helpful} and notHelpful = ${initialNotHelpful + 1}`);
    }
    console.log("TEST CASE C (Feedback swapping & count shifting) passed!");

    // --- TEST GET /api/articles/feedback.php endpoint ---
    console.log("\n5. GET /api/articles/feedback.php - Retrieving active logs for this article");
    const getLogsRes = await makeRequest({
      host,
      port,
      path: `/api/articles/feedback.php?article_id=${articleId}`,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const parsedLogs = JSON.parse(getLogsRes.body);
    console.log("GET logs list response length:", parsedLogs.data.length);
    const testLog = parsedLogs.data.find(l => Number(l.user_id) === testUserId);
    if (!testLog) {
      throw new Error("Could not find the test log entry in MySQL database!");
    }
    console.log("Found log entry details:", testLog);
    if (testLog.isHelpful !== false || testLog.userEmail !== testUserEmail) {
      throw new Error(`Expected isHelpful: false, userEmail: ${testUserEmail}`);
    }
    console.log("Database logging and retrieval verification: OK!");

    // --- TEST POST /api/articles/feedback.php adapter endpoint (cancelling the swap) ---
    console.log("\n6. POST /api/articles/feedback.php - Sending is_helpful: false (adapter should cancel choice)");
    const postAdapterRes = await makeRequest({
      host,
      port,
      path: `/api/articles/feedback.php`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, {
      id: articleId,
      user_id: testUserId,
      user_email: testUserEmail,
      is_helpful: false
    });

    console.log("Adapter POST Response:", postAdapterRes.body);
    const getArticlesRes5 = await makeRequest({
      host,
      port,
      path: '/api/articles',
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    const finalArticleStats = JSON.parse(getArticlesRes5.body).data.find(a => Number(a.id) === Number(articleId));
    console.log(`Final stats: Helpful = ${finalArticleStats.helpful}, Not Helpful = ${finalArticleStats.notHelpful}`);
    if (Number(finalArticleStats.helpful) !== initialHelpful || Number(finalArticleStats.notHelpful) !== initialNotHelpful) {
      throw new Error("Final stats did not revert back to initial counts!");
    }
    console.log("PHP adapter routing and toggle cancellation passed!");

    console.log("\nAll article feedback API integration tests passed successfully! 🚀");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    await connection.end();
  }
})();
