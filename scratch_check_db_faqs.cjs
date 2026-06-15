const fs = require('fs');
const path = require('path');

const dbJsonPath = path.join(__dirname, 'db.json');
if (fs.existsSync(dbJsonPath)) {
  const db = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
  console.log("First 5 FAQs in db.json:");
  console.log(db.faqs.slice(0, 5));
} else {
  console.log("db.json not found.");
}
