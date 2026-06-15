import fs from 'fs';

const content = fs.readFileSync('server.ts', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('=== adminId') || line.includes('=== user.id') || line.includes('.id ===')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
