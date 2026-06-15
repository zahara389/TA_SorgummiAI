const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'dashboard', 'FAQTable.tsx');
if (!fs.existsSync(filePath)) {
  console.log("File not found");
  process.exit(1);
}
const content = fs.readFileSync(filePath, 'utf8');

const queries = ['handlesave', 'validateForm', 'createfaq', 'updatefaq', 'category', 'status', 'userEmail'];

queries.forEach(q => {
  const matches = [];
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(q.toLowerCase())) {
      matches.push({ lineNum: idx + 1, content: line.trim() });
    }
  });
  console.log(`\n=== Matches for: "${q}" ===`);
  matches.slice(0, 15).forEach(m => {
    console.log(`Line ${m.lineNum}: ${m.content}`);
  });
});
