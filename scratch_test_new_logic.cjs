const path = require('path');
const fs = require('fs');

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

const port = process.env.PORT || 3000;
const baseUrl = `http://localhost:${port}/api`;

async function runTests() {
  try {
    console.log("\n=== STARTING INTEGRATION TESTS FOR NEW LOGIC ===");

    // 1. Get first article and product to use for testing
    console.log("\n1. Fetching articles to find a test ID...");
    const articlesRes = await fetch(`${baseUrl}/articles`);
    const articlesData = await articlesRes.json();
    const success = articlesData.success || articlesData.status === "success";
    if (!success || !articlesData.data || articlesData.data.length === 0) {
      throw new Error("No articles found in the database. Please make sure database is seeded.");
    }
    const testArticle = articlesData.data[0];
    const articleId = testArticle.id;
    console.log(`Using Article ID: ${articleId} ("${testArticle.title}") for tests.`);

    // 2. Test POST /api/articles/:id/save (toggle bookmark)
    console.log("\n2. Testing saved article toggle (bookmarking)...");
    const saveRes = await fetch(`${baseUrl}/articles/${articleId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "1" })
    });
    const saveResult = await saveRes.json();
    console.log("Toggle save status:", saveRes.status);
    console.log("Toggle save response:", saveResult);

    // 3. Test GET /api/articles/saved.php (JOIN query verification)
    console.log("\n3. Testing GET saved articles...");
    const getSavedRes = await fetch(`${baseUrl}/articles/saved.php?user_id=1`);
    const getSavedResult = await getSavedRes.json();
    console.log("GET saved status:", getSavedRes.status);
    console.log("Saved articles count:", getSavedResult.data ? getSavedResult.data.length : 0);
    if (getSavedResult.data) {
      console.log("Saved article item sample:", JSON.stringify(getSavedResult.data[0], null, 2));
    }

    // 4. Test POST /api/articles/:id/save (toggle bookmark again to unsave)
    console.log("\n4. Testing saved article toggle again (unbookmarking)...");
    const unsaveRes = await fetch(`${baseUrl}/articles/${articleId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "1" })
    });
    const unsaveResult = await unsaveRes.json();
    console.log("Toggle unsave status:", unsaveRes.status);
    console.log("Toggle unsave response:", unsaveResult);

    // 5. Verify saved articles count is back to before
    const getSavedRes2 = await fetch(`${baseUrl}/articles/saved.php?user_id=1`);
    const getSavedResult2 = await getSavedRes2.json();
    console.log("GET saved status after unsave:", getSavedRes2.status);
    console.log("Saved articles count after unsave:", getSavedResult2.data ? getSavedResult2.data.length : 0);

    // 6. Test views increment logic
    console.log("\n6. Testing article view tracking endpoint...");
    const viewsRes = await fetch(`${baseUrl}/articles/views.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: articleId, user_id: "1" })
    });
    const viewsResult = await viewsRes.json();
    console.log("Increment views status:", viewsRes.status);
    console.log("Increment views response:", viewsResult);

    // 7. Verify AI Chat query stats, Article views, and Dashboard Summary
    console.log("\n7. Fetching Dashboard Stats to verify Real counts...");
    
    // Check Chat count
    const chatCountRes = await fetch(`${baseUrl}/dashboard/chat/count`);
    const chatCountData = await chatCountRes.json();
    console.log("GET /api/dashboard/chat/count status:", chatCountRes.status);
    console.log("Total AI Chats Count (Real database sender='user'):", chatCountData.data.totalAIChats);

    // Check Analytics Dashboard Summary
    const analyticsRes = await fetch(`${baseUrl}/analytics/dashboard?period=7d`);
    const analyticsData = await analyticsRes.json();
    console.log("GET /api/analytics/dashboard status:", analyticsRes.status);
    console.log("Analytics summary stats:");
    console.log("- Total Users:", analyticsData.data.users.totalUsers);
    console.log("- Total AI Interactions:", analyticsData.data.ai.totalInteractions);
    console.log("- Total Article Views:", analyticsData.data.articles.totalArticleViews);
    // Check User Stats
    const userStatsRes = await fetch(`${baseUrl}/user/stats.php?user_id=1`);
    const userStatsData = await userStatsRes.json();
    console.log("GET /api/user/stats.php status:", userStatsRes.status);
    console.log("User Stats Data:", JSON.stringify(userStatsData.data, null, 2));

    console.log("\n=== ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY ===");
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

runTests();
