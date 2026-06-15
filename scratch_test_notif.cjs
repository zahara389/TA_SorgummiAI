const http = require('http');

function makeRequest(options, postData = null) {
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
      req.write(postData);
    }
    req.end();
  });
}

(async () => {
  const host = 'localhost';
  const port = 3000; // Let's check server port or default to 3000

  console.log("Checking notifications endpoints on port " + port + "...");

  try {
    // 1. GET /api/notifications without Referer (Should return plain array)
    const resGetPlain = await makeRequest({
      host,
      port,
      path: '/api/notifications',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    console.log("GET /api/notifications (Plain Array) status:", resGetPlain.statusCode);
    console.log("GET /api/notifications (Plain Array) body:", resGetPlain.body);
    const parsedGetPlain = JSON.parse(resGetPlain.body);
    if (!Array.isArray(parsedGetPlain)) {
      throw new Error("Expected plain array, got: " + typeof parsedGetPlain);
    }
    console.log("GET /api/notifications (Plain Array) is an array: OK");

    // 2. GET /api/notifications with Referer (Should return success/data wrapper)
    const resGetWrapped = await makeRequest({
      host,
      port,
      path: '/api/notifications',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Referer': 'http://localhost:3000/admin',
      }
    });
    console.log("GET /api/notifications (Wrapped) status:", resGetWrapped.statusCode);
    console.log("GET /api/notifications (Wrapped) body:", resGetWrapped.body);
    const parsedGetWrapped = JSON.parse(resGetWrapped.body);
    if (parsedGetWrapped.status !== 'success' || !Array.isArray(parsedGetWrapped.data)) {
      throw new Error("Expected wrapped response { status: 'success', data: [...] }");
    }
    console.log("GET /api/notifications (Wrapped) structure: OK");

    // 3. POST /api/notifications
    const postBody = JSON.stringify({
      judul: 'Pengumuman Uji Coba Baru',
      tipe: 'Info',
      target: 'Semua User',
      konten: 'Ini adalah isi dari pengumuman uji coba baru.'
    });

    const resPost = await makeRequest({
      host,
      port,
      path: '/api/notifications',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody),
      }
    }, postBody);
    console.log("POST /api/notifications status:", resPost.statusCode);
    console.log("POST /api/notifications body:", resPost.body);
    const parsedPost = JSON.parse(resPost.body);
    if (!parsedPost.success || parsedPost.message !== 'Notifikasi berhasil dikirim!') {
      throw new Error("Expected success response for POST");
    }
    console.log("POST /api/notifications response: OK");

    // 4. GET /api/notifications again to verify the new notification is listed
    const resGetAfter = await makeRequest({
      host,
      port,
      path: '/api/notifications',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    console.log("GET /api/notifications (After POST) body:", resGetAfter.body);
    const parsedGetAfter = JSON.parse(resGetAfter.body);
    const found = parsedGetAfter.find(n => n.judul === 'Pengumuman Uji Coba Baru');
    if (!found) {
      throw new Error("Newly added notification not found in GET response");
    }
    console.log("Verified newly added notification in GET response: OK");
    console.log("All tests passed successfully!");
  } catch (err) {
    console.error("Test failed:", err);
  }
})();
