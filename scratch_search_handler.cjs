const fs = require('fs');
const file = 'server.ts';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

console.log("Printing lines 5270 to 5310:");
for (let i = 5269; i < 5310; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
