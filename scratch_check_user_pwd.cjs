const fs = require('fs');
const path = require('path');

const dbJsonPath = path.join(__dirname, 'db.json');
if (fs.existsSync(dbJsonPath)) {
  const db = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
  console.log("Users in db.json:", db.users.map(u => ({ email: u.email, name: u.name, role: u.role, password: u.password })));
} else {
  console.log("db.json not found.");
}
