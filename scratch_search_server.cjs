const fs = require('fs');
const file = 'server.ts';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const q = 'stats.php';
lines.forEach((line, idx) => {
  if (line.includes(q)) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
