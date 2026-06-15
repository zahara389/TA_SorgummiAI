const http = require('http');

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

  console.log("Checking feedbacks endpoints on port " + port + "...");

  try {
    // 1. POST /api/feedbacks
    const postPayload = {
      user_id: 1, // Admin user
      product_id: 1, // Cookies Sorgum
      message: "Uji coba masukan baru dari Antigravity"
    };

    console.log("Sending POST /api/feedbacks with payload:", postPayload);
    const postRes = await makeRequest({
      host,
      port,
      path: '/api/feedbacks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    }, postPayload);

    console.log("POST /api/feedbacks status:", postRes.statusCode);
    console.log("POST /api/feedbacks body:", postRes.body);

    const parsedPost = JSON.parse(postRes.body);
    if (!parsedPost.success || parsedPost.message !== 'Masukan Anda berhasil dikirim!') {
      throw new Error("POST feedback response structure or message is invalid");
    }
    console.log("POST verification: OK");

    // 2. GET /api/feedbacks (wrapped/frontend format)
    console.log("Sending GET /api/feedbacks (Wrapped)...");
    const getResWrapped = await makeRequest({
      host,
      port,
      path: '/api/feedbacks?frontend=true',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    console.log("GET /api/feedbacks (Wrapped) status:", getResWrapped.statusCode);
    const parsedGetWrapped = JSON.parse(getResWrapped.body);
    console.log("GET /api/feedbacks (Wrapped) body structure check:");
    console.log("- status:", parsedGetWrapped.status);
    console.log("- data array length:", parsedGetWrapped.data.length);
    
    if (parsedGetWrapped.status !== 'success' || !Array.isArray(parsedGetWrapped.data)) {
      throw new Error("GET feedback wrapped response structure is invalid");
    }

    // Find the feedback we just added
    const testFeedback = parsedGetWrapped.data.find(f => f.message === "Uji coba masukan baru dari Antigravity");
    if (!testFeedback) {
      throw new Error("Could not find the test feedback in GET feedbacks response");
    }

    console.log("Found test feedback in response:");
    console.log("- id:", testFeedback.id);
    console.log("- pengirim (Should be Admin email):", testFeedback.pengirim);
    console.log("- produk_artikel (Should be Cookies Sorgum):", testFeedback.produk_artikel);
    console.log("- tanggal:", testFeedback.tanggal);
    console.log("- status:", testFeedback.status);

    if (!testFeedback.id || !testFeedback.pengirim || !testFeedback.produk_artikel || !testFeedback.tanggal || !testFeedback.status) {
      throw new Error("Feedback properties missing required fields (id, pengirim, produk_artikel, tanggal, status)");
    }

    console.log("GET verification: OK");

    // 3. PUT /api/feedbacks (Update Status to DITINJAU)
    const putPayload = {
      id: testFeedback.id,
      status: "DITINJAU"
    };

    console.log("Sending PUT /api/feedbacks to update status to DITINJAU...");
    const putRes = await makeRequest({
      host,
      port,
      path: '/api/feedbacks',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    }, putPayload);

    console.log("PUT /api/feedbacks status:", putRes.statusCode);
    console.log("PUT /api/feedbacks body:", putRes.body);

    const parsedPut = JSON.parse(putRes.body);
    if (parsedPut.status !== 'success') {
      throw new Error("PUT update status response status is not success");
    }

    // Verify status updated in database by calling GET feedbacks again
    console.log("Re-verifying GET feedbacks to check updated status...");
    const getResWrapped2 = await makeRequest({
      host,
      port,
      path: '/api/feedbacks?frontend=true',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    const parsedGetWrapped2 = JSON.parse(getResWrapped2.body);
    const updatedFeedback = parsedGetWrapped2.data.find(f => f.id === testFeedback.id);
    if (!updatedFeedback || updatedFeedback.status !== 'DITINJAU') {
      throw new Error(`Expected updated status 'DITINJAU', but got: ${updatedFeedback ? updatedFeedback.status : 'undefined'}`);
    }

    console.log("PUT verification: OK (Status updated successfully in DB to DITINJAU)");
    console.log("All feedbacks API integration tests (POST, GET, and PUT) passed successfully!");
  } catch (err) {
    console.error("Test failed:", err);
  }
})();
