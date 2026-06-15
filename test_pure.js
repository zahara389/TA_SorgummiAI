import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

const filePath = path.resolve('uploads/knowledge/valid_sorgum_doc.pdf');

async function run() {
  const buffer = await fs.promises.readFile(filePath);
  console.log('File size:', buffer.length);
  try {
    const data = await pdfParse(buffer);
    console.log('Success! Text length:', data.text.length);
    console.log('Text snippet:', JSON.stringify(data.text.slice(0, 300)));
  } catch (err) {
    console.error('Failed:', err);
  }
}

run();
