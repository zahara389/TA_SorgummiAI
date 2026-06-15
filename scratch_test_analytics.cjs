const http = require('http');

function makeRequest(options) {
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

    req.end();
  });
}

(async () => {
  const host = 'localhost';
  const port = 3000;

  console.log("Checking analytics endpoints on port " + port + "...");

  try {
    // 1. GET /api/analytics/dashboard
    const resDashboard = await makeRequest({
      host,
      port,
      path: '/api/analytics/dashboard?period=7d',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    console.log("GET /api/analytics/dashboard status:", resDashboard.statusCode);
    const parsedDashboard = JSON.parse(resDashboard.body);
    console.log("Dashboard Summary Result:");
    console.log("- Period Label:", parsedDashboard.data.periodLabel);
    console.log("- Total Users (Should be real, e.g. 100+):", parsedDashboard.data.users.totalUsers);
    console.log("- Total Articles:", parsedDashboard.data.articles.totalArticles);
    console.log("- Total AI Interactions:", parsedDashboard.data.ai.totalInteractions);

    if (parsedDashboard.data.users.totalUsers < 100) {
      throw new Error(`Expected real database user count (~100+), but got: ${parsedDashboard.data.users.totalUsers}`);
    }
    console.log("Dashboard user count verification: OK");

    // 2. GET /api/analytics/charts
    const resCharts = await makeRequest({
      host,
      port,
      path: '/api/analytics/charts?period=7d',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    console.log("GET /api/analytics/charts status:", resCharts.statusCode);
    const parsedCharts = JSON.parse(resCharts.body);
    console.log("Charts ResultKeys:", Object.keys(parsedCharts.data));
    console.log("- Users chart length:", parsedCharts.data.users.length);

    console.log("All analytics integration tests passed successfully!");
  } catch (err) {
    console.error("Test failed:", err);
  }
})();
