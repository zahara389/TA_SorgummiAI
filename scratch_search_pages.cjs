const fs = require('fs');
const path = require('path');

function inspectPage(fileName) {
  const filePath = path.join(__dirname, 'src', 'pages', fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n=== [${fileName}] ===`);
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('fetch') || line.includes('get') || line.includes('Article') || line.includes('Product')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
}

inspectPage('Edukasi.tsx');
inspectPage('Pengelolaan.tsx');
