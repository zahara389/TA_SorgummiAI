import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

console.log('--- Searching for model names with "models/" prefix ---');
walkDir('.', (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.json') || filePath.endsWith('.tsx')) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('models/gemini') || content.includes('models/text-embedding')) {
      console.log(`Found in: ${filePath}`);
      // find exact lines
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('models/gemini') || line.includes('models/text-embedding')) {
          console.log(`  Line ${idx + 1}: ${line.trim()}`);
        }
      });
    }
  }
});
