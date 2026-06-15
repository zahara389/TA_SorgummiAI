const path = require('path');
const fs = require('fs');

const port = process.env.PORT || 3000;
const baseUrl = `http://localhost:${port}/api`;

async function testViews() {
  try {
    console.log("=== STARTING VIEWS AND STATS VERIFICATION ===");
    
    // 1. Fetch current profile stats for user 1
    console.log("\n1. Fetching initial user profile stats...");
    const initialStatsRes = await fetch(`${baseUrl}/user/stats.php?user_id=1`);
    const initialStats = await initialStatsRes.json();
    console.log("Initial User Stats:", initialStats.data);
    const initialCount = initialStats.data.articlesReadCount;

    // 2. Simulate article view (Edukasi) detail click
    console.log("\n2. Simulating article detail view (Edukasi)...");
    const articleViewRes = await fetch(`${baseUrl}/articles/views.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 1, user_id: 1 })
    });
    const articleViewResult = await articleViewRes.json();
    console.log("Article view track response:", articleViewResult);

    // 3. Simulate product/guide view (Pengelolaan) detail click
    console.log("\n3. Simulating product detail view (Pengelolaan)...");
    const productViewRes = await fetch(`${baseUrl}/products/views.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 1, user_id: 1 })
    });
    const productViewResult = await productViewRes.json();
    console.log("Product view track response:", productViewResult);

    // 4. Fetch updated stats
    console.log("\n4. Fetching updated user profile stats...");
    const updatedStatsRes = await fetch(`${baseUrl}/user/stats.php?user_id=1`);
    const updatedStats = await updatedStatsRes.json();
    console.log("Updated User Stats:", updatedStats.data);
    const finalCount = updatedStats.data.articlesReadCount;

    console.log(`\nIncrease in articlesReadCount: ${finalCount - initialCount}`);
    if (finalCount > initialCount) {
      console.log("SUCCESS: The count increased! The view tracking and stats count is fully working.");
    } else {
      console.log("FAILURE: The count did not increase.");
    }

  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

testViews();
