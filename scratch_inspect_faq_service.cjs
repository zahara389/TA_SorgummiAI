const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'dataService.ts');
if (!fs.existsSync(filePath)) {
  console.log("File not found");
  process.exit(1);
}
const content = fs.readFileSync(filePath, 'utf8');

const queries = ['createFaq', 'updateFaq', 'deleteFaq', 'replyContactMessage', 'getAllFaqs'];

queries.forEach(q => {
  const matches = [];
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(q.toLowerCase())) {
      matches.push({ lineNum: idx + 1, content: line.trim() });
    }
  });
  console.log(`\n=== Matches for: "${q}" ===`);
  matches.forEach(m => {
    console.log(`Line ${m.lineNum}: ${m.content}`);
    // Print 8 lines after the match
    for (let i = 1; i <= 8; i++) {
      if (lines[m.lineNum - 1 + i] !== undefined) {
        console.log(`  +${i}: ${lines[m.lineNum - 1 + i].trim()}`);
      }
    }
  });
});
