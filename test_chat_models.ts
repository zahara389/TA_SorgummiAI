import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from "@google/genai";

// Load env
(function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let val = match[2].trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
    });
  }
})();

async function testModels() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("No API key");
    return;
  }
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-pro", "gemini-2.0-pro-exp-02-05"];
  
  for (const model of models) {
    try {
      console.log(`--- Testing model: ${model} ---`);
      const response = await client.models.generateContent({
        model: model,
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
      });
      console.log(`Success! Model ${model} is supported. Response keys:`, Object.keys(response));
    } catch (err: any) {
      console.error(`Error for ${model}:`, err?.message || err);
    }
  }
}

testModels();
