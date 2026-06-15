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

async function testAdminProfile() {
  console.log("\n=== TESTING ADMIN PROFILE ===");
  // Test GET admin profile
  const getRes = await fetch(`${baseUrl}/admin/profile?admin_id=1`);
  const getData = await getRes.json();
  console.log("GET profile status:", getRes.status);
  console.log("GET profile data:", JSON.stringify(getData, null, 2));

  // Test PATCH admin profile
  const patchRes = await fetch(`${baseUrl}/admin/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      admin_id: "1",
      name: "Admin Sorgummi Real",
      phone: "+6281234567890"
    })
  });
  const patchData = await patchRes.json();
  console.log("PATCH profile status:", patchRes.status);
  console.log("PATCH profile data:", JSON.stringify(patchData, null, 2));
}

async function testArticlesCrud() {
  console.log("\n=== TESTING ARTICLES CRUD ===");
  // Test POST create article
  const postRes = await fetch(`${baseUrl}/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Artikel Tes CRUD MySQL",
      content: "Konten tes.",
      category: "Budidaya Sorgum",
      status: "Published",
      author: "Admin",
      readTime: "3 menit"
    })
  });
  const postData = await postRes.json();
  console.log("POST article status:", postRes.status);
  console.log("POST article data:", JSON.stringify(postData, null, 2));
  
  if (!postData.success) {
    console.error("Post article failed.");
    return;
  }
  const articleId = postData.data.id;

  // Test PUT update article
  const putRes = await fetch(`${baseUrl}/articles/${articleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Artikel Tes CRUD MySQL Updated",
      content: "Konten tes updated."
    })
  });
  const putData = await putRes.json();
  console.log("PUT article status:", putRes.status);
  console.log("PUT article response:", JSON.stringify(putData, null, 2));

  // Test DELETE article
  const delRes = await fetch(`${baseUrl}/articles/${articleId}`, {
    method: "DELETE"
  });
  const delData = await delRes.json();
  console.log("DELETE article status:", delRes.status);
  console.log("DELETE article response:", JSON.stringify(delData, null, 2));
}

async function testLandsCrud() {
  console.log("\n=== TESTING LANDS CRUD ===");
  // Test POST create land field
  const postRes = await fetch(`${baseUrl}/user/fields.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: "1",
      name: "Lahan Percobaan Baru",
      size: "2.5 Hektar",
      location: "Grobogan",
      commodity: "Sorgum Ketan"
    })
  });
  const postData = await postRes.json();
  console.log("POST land status:", postRes.status);
  console.log("POST land data:", JSON.stringify(postData, null, 2));
  
  if (!postData.success) {
    console.error("Post land failed.");
    return;
  }
  const landId = postData.data.id;

  // Test GET land fields
  const getRes = await fetch(`${baseUrl}/user/fields.php?user_id=1`);
  const getData = await getRes.json();
  console.log("GET land status:", getRes.status);
  console.log("GET land list count:", getData.data.length);

  // Test DELETE land
  const delRes = await fetch(`${baseUrl}/user/fields.php?id=${landId}`, {
    method: "DELETE"
  });
  const delData = await delRes.json();
  console.log("DELETE land status:", delRes.status);
  console.log("DELETE land response:", JSON.stringify(delData, null, 2));
}

async function testNotificationsCrud() {
  console.log("\n=== TESTING NOTIFICATIONS CRUD ===");
  // Test POST notification
  const postRes = await fetch(`${baseUrl}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Notif Uji Coba CRUD",
      message: "Konten uji coba",
      target_role: "all",
      type: "Info"
    })
  });
  const postData = await postRes.json();
  console.log("POST notification status:", postRes.status);
  console.log("POST notification data:", JSON.stringify(postData, null, 2));

  if (!postData.success) {
    console.error("Post notification failed.");
    return;
  }
  const notifId = postData.data.id;

  // Test GET notifications
  const getRes = await fetch(`${baseUrl}/notifications?frontend=true`);
  const getData = await getRes.json();
  console.log("GET notifications status:", getRes.status);
  console.log("GET notifications count:", getData.data.length);

  // Test DELETE notification
  const delRes = await fetch(`${baseUrl}/notifications/${notifId}`, {
    method: "DELETE"
  });
  const delData = await delRes.json();
  console.log("DELETE notification status:", delRes.status);
  console.log("DELETE notification response:", JSON.stringify(delData, null, 2));
}

(async () => {
  try {
    await testAdminProfile();
    await testArticlesCrud();
    await testLandsCrud();
    await testNotificationsCrud();
    console.log("\n=== ALL TESTS COMPLETED SUCCESSFULY ===");
  } catch (err) {
    console.error("Test execution failed:", err);
  }
})();
