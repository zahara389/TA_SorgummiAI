const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.ts');
const content = fs.readFileSync(filePath, 'utf8');

const queries = ['/api/articles', '/api/products', 'app.post', 'app.get', 'app.put', 'app.delete', 'products', 'articles'];

queries.forEach(q => {
  const matches = [];
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(q.toLowerCase())) {
      matches.push({ lineNum: idx + 1, content: line.trim() });
    }
  });
  console.log(`\n=== Matches for: "${q}" (Count: ${matches.length}) ===`);
  matches.slice(0, 15).forEach(m => {
    console.log(`Line ${m.lineNum}: ${m.content}`);
  });
});
