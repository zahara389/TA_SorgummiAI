import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";

type KnowledgeFileRecord = {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  status: "PROCESSING" | "INDEXED" | "FAILED";
  version: number;
  url: string;
  error_message?: string | null;
};

type KnowledgeContentRecord = {
  id: string;
  knowledge_file_id: string;
  content: string;
  chunk_index: number;
  created_at: string;
  source_title: string;
};

type KnowledgeEmbeddingRecord = {
  id: string;
  source_type: "FAQ" | "ARTICLE" | "SOLUTION" | "KNOWLEDGE_FILE";
  source_id: string;
  chunk_id: string;
  content: string;
  embedding: number[];
  created_at: string;
};

export class KnowledgeService {
  private getData: () => any;
  private saveData: (data: any) => void;
  private geminiClient: any;
  private legacyGeminiClient: any;
  private uploadDir: string;
  private embeddingModel: string;

  constructor(getData: () => any, saveData: (data: any) => void) {
    this.getData = getData;
    this.saveData = saveData;
    this.uploadDir = path.join(process.cwd(), "uploads", "knowledge");
    this.embeddingModel =
      process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-3-large";

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.geminiClient = new GoogleGenAI({ apiKey });
      this.legacyGeminiClient = new GoogleGenerativeAI(apiKey);
    }
  }

  private get db() {
    return this.getData();
  }

  private saveDb(db: any) {
    this.saveData(db);
  }

  private sanitizeFileName(value: string) {
    return value
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .replace(/_+/g, "_")
      .slice(0, 220);
  }

  private createId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  async uploadKnowledgeFile(file: any, uploadedBy: string = "Administrator") {
    const db = this.db;
    const extension = path.extname(file.originalname).toLowerCase();
    const allowed = [".pdf", ".doc", ".docx", ".txt", ".json", ".csv"];
    if (!allowed.includes(extension)) {
      throw new Error("Format file tidak didukung. Gunakan PDF, DOC, DOCX, TXT, JSON, atau CSV.");
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error("Ukuran file maksimal adalah 20 MB.");
    }

    const originalName = file.originalname;
    const existingVersions = (db.knowledge_files || []).filter(
      (f: any) => f.original_name === originalName,
    ).length;
    const version = existingVersions + 1;
    const baseName = this.sanitizeFileName(path.basename(originalName, extension));
    const filename = `${baseName}_v${version}${extension}`;
    const destinationPath = path.join(this.uploadDir, filename);

    // If multer wrote a temporary file to another path, move it. Otherwise keep the file.
    if (file.path) {
      const absoluteFilePath = path.resolve(file.path);
      const absoluteDestPath = path.resolve(destinationPath);
      if (absoluteFilePath !== absoluteDestPath) {
        fs.renameSync(file.path, destinationPath);
      }
    }

    const fileId = this.createId("knowledge_file");
    const fileRecord: KnowledgeFileRecord = {
      id: fileId,
      filename,
      original_name: originalName,
      file_type: extension.replace(".", "").toUpperCase(),
      file_size: file.size,
      uploaded_by: uploadedBy,
      uploaded_at: new Date().toISOString(),
      status: "PROCESSING",
      version,
      url: `/uploads/knowledge/${encodeURIComponent(filename)}`,
    };

    db.knowledge_files = db.knowledge_files || [];
    db.knowledge_files.push(fileRecord);
    this.saveDb(db);

    try {
      let extractedText = await this.extractText(destinationPath, extension);
      extractedText = this.cleanText(extractedText);
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("Gagal mengekstrak konten dari file.");
      }

      const chunks = this.chunkText(extractedText, 1000, 200);
      db.knowledge_contents = db.knowledge_contents || [];
      const createdChunks = chunks.map((content, index) => {
        const chunkRecord: KnowledgeContentRecord = {
          id: this.createId("knowledge_chunk"),
          knowledge_file_id: fileId,
          content,
          chunk_index: index,
          created_at: new Date().toISOString(),
          source_title: originalName,
        };
        db.knowledge_contents.push(chunkRecord);
        return chunkRecord;
      });

      const chunkTexts = createdChunks.map((chunk) => chunk.content);
      const embeddings = await this.buildEmbeddings(chunkTexts);
      db.knowledge_embeddings = db.knowledge_embeddings || [];
      embeddings.forEach((vector, index) => {
        const chunk = createdChunks[index];
        if (!Array.isArray(vector) || vector.length === 0) return;
        db.knowledge_embeddings.push({
          id: this.createId("knowledge_emb"),
          source_type: "KNOWLEDGE_FILE",
          source_id: fileId,
          chunk_id: chunk.id,
          content: chunk.content,
          embedding: vector,
          created_at: new Date().toISOString(),
        });
      });

      fileRecord.status = "INDEXED";
      this.autoResolveGaps(db);
      this.saveDb(db);

      return {
        file: fileRecord,
        chunkCount: createdChunks.length,
        embeddingCount: db.knowledge_embeddings.filter(
          (e: any) => e.source_id === fileId,
        ).length,
        steps: [
          { step: "Uploaded", status: "done" },
          { step: "Extracted", status: "done" },
          { step: "Chunking", status: "done" },
          { step: "Embedding", status: "done" },
          { step: "Indexed", status: "done" },
        ],
      };
    } catch (err: any) {
      fileRecord.status = "FAILED";
      fileRecord.error_message = err.message || String(err);
      this.saveDb(db);
      throw err;
    }
  }

  private readFileAsBuffer(filePath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      const stream = fs.createReadStream(filePath);
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", (err) => reject(err));
    });
  }

  private async extractText(filePath: string, extension: string) {
    const normalized = extension.toLowerCase();
    if (normalized === ".pdf") {
      return await this.extractPdfText(filePath);
    }
    if (normalized === ".docx") {
      return await this.extractDocxText(filePath);
    }
    if (normalized === ".doc") {
      return await this.extractDocText(filePath);
    }
    if (normalized === ".txt") {
      const buffer = await this.readFileAsBuffer(filePath);
      return buffer.toString("utf8");
    }
    if (normalized === ".json") {
      const buffer = await this.readFileAsBuffer(filePath);
      return this.flattenJson(JSON.parse(buffer.toString("utf8")));
    }
    if (normalized === ".csv") {
      const buffer = await this.readFileAsBuffer(filePath);
      return this.parseCsv(buffer.toString("utf8"));
    }
    return "";
  }

  private async extractPdfText(filePath: string) {
    console.log('[KnowledgeService] Extracting PDF text from:', filePath);
    const pdfParse = await import("pdf-parse");
    const buffer = await this.readFileAsBuffer(filePath);
    console.log('[KnowledgeService] PDF buffer size read via stream:', buffer.length, 'bytes');
    const data = await (pdfParse.default || pdfParse)(buffer);
    return data.text || "";
  }

  private async extractDocxText(filePath: string) {
    const mammothModule = await import("mammoth");
    const mammoth = mammothModule.default || mammothModule;
    const buffer = await this.readFileAsBuffer(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  private async extractDocText(filePath: string) {
    const wordExtractorModule = await import("word-extractor");
    const WordExtractor =
      (wordExtractorModule as any).WordExtractor ||
      (wordExtractorModule as any).default ||
      wordExtractorModule;
    const extractor = new WordExtractor();
    const buffer = await this.readFileAsBuffer(filePath);
    const doc = await extractor.extract(buffer);
    return doc.getBody() || "";
  }

  private async parseCsv(raw: string) {
    const csvParseModule = await import("csv-parse/sync");
    const parseFn =
      (csvParseModule as any).parse ||
      (csvParseModule as any).default ||
      csvParseModule;
    const rows = parseFn(raw, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
    });

    return rows
      .map((row: any) => {
        if (Array.isArray(row)) {
          return row.filter(Boolean).join(" | ");
        }
        if (typeof row === "object" && row !== null) {
          return Object.values(row)
            .filter(Boolean)
            .join(" | ");
        }
        return String(row || "");
      })
      .join("\n");
  }

  private flattenJson(value: any, prefix = "") {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return `${prefix}${value}`.trim();
    }
    if (Array.isArray(value)) {
      return value
        .map((item, index) => this.flattenJson(item, `${prefix}`))
        .filter(Boolean)
        .join("\n");
    }
    if (typeof value === "object") {
      return Object.entries(value)
        .map(([key, item]) => this.flattenJson(item, `${prefix}${key}: `))
        .filter(Boolean)
        .join("\n");
    }
    return "";
  }

  private cleanText(text: string): string {
    if (!text) return "";
    let cleaned = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "") // remove control characters
      .replace(/\r\n/g, "\n")
      .replace(/\n\s*\n/g, "\n")
      .replace(/\s+/g, " ")
      .trim();

    // Collapse repeating contiguous words/phrases (case-insensitive)
    cleaned = cleaned.replace(/\b([\w-]+)(?:\s+\1\b)+/gi, "$1");
    cleaned = cleaned.replace(/\b([\w-]+\s+[\w-]+)(?:\s+\1\b)+/gi, "$1");
    return cleaned;
  }

  private chunkText(text: string, chunkSize = 1000, overlap = 200) {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) return [];

    const chunks: string[] = [];
    let start = 0;
    while (start < normalized.length) {
      const end = Math.min(normalized.length, start + chunkSize);
      const chunk = normalized.slice(start, end).trim();
      if (chunk.length) {
        chunks.push(chunk);
      }
      start += chunkSize - overlap;
    }
    return chunks;
  }

  private async buildEmbeddings(texts: string[]): Promise<number[][]> {
    if (!process.env.GEMINI_API_KEY || texts.length === 0) {
      return texts.map(() => []);
    }

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const callWithRetry = async (fn: () => Promise<any>, retries = 3, initialDelay = 2000): Promise<any> => {
      let attempt = 0;
      while (attempt < retries) {
        attempt++;
        try {
          return await fn();
        } catch (err: any) {
          const is429 = err?.status === 429 || err?.code === 429 || String(err?.message || "").includes("429") || String(err || "").includes("429");
          if (is429 && attempt < retries) {
            const delay = initialDelay * Math.pow(2, attempt - 1);
            console.warn(`[KnowledgeService] Gemini API Rate Limit (429) hit. Retrying attempt ${attempt}/${retries} in ${delay}ms...`);
            await sleep(delay);
          } else {
            throw err;
          }
        }
      }
    };

    try {
      const genAI = this.legacyGeminiClient || new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

      const batchSize = 100;
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        if (i > 0) {
          console.log("[KnowledgeService] Delaying 2s between embedding batches to avoid 429 limit...");
          await sleep(2000);
        }

        const chunk = texts.slice(i, i + batchSize);
        const result = await callWithRetry(async () => {
          return await model.batchEmbedContents({
            requests: chunk.map((text) => ({
              content: { role: "user", parts: [{ text }] },
            })),
          });
        });

        if (result.embeddings) {
          result.embeddings.forEach((e: any) => {
            if (e.values) allEmbeddings.push(e.values);
          });
        }
      }
      return allEmbeddings;
    } catch (err) {
      console.error("[KnowledgeService] Embedding generation with @google/generative-ai failed, trying @google/genai:", err);
      if (!this.geminiClient) return texts.map(() => []);
      try {
        const results: number[][] = [];
        for (const text of texts) {
          if (results.length > 0) {
            await sleep(500); // 500ms delay between individual fallback embeddings
          }
          const response = await callWithRetry(async () => {
            return await this.geminiClient.models.embedContent({
              model: "gemini-embedding-2",
              contents: text,
            });
          });
          const vector = response?.embeddings?.[0]?.values || [];
          results.push(vector);
        }
        return results;
      } catch (fallbackErr) {
        console.error("[KnowledgeService] Fallback embedding failed:", fallbackErr);
        return texts.map(() => []);
      }
    }
  }

  private cosineSimilarity(a: number[], b: number[]) {
    if (!a || !b || a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  listKnowledgeFiles() {
    return (this.db.knowledge_files || []).map((file: any) => ({
      ...file,
      url: file.url || `/uploads/knowledge/${encodeURIComponent(file.filename)}`,
    }));
  }

  async deleteKnowledgeFile(id: string) {
    const db = this.db;
    const file = (db.knowledge_files || []).find((f: any) => f.id === id);
    if (!file) {
      throw new Error("File knowledge tidak ditemukan.");
    }
    const filePath = path.join(this.uploadDir, file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    db.knowledge_files = (db.knowledge_files || []).filter(
      (f: any) => f.id !== id,
    );
    db.knowledge_contents = (db.knowledge_contents || []).filter(
      (chunk: any) => chunk.knowledge_file_id !== id,
    );
    db.knowledge_embeddings = (db.knowledge_embeddings || []).filter(
      (embedding: any) => embedding.source_id !== id,
    );
    this.saveDb(db);
    return { success: true };
  }

  async searchKnowledge(query: string) {
    const normalized = String(query || "").trim().toLowerCase();
    const db = this.db;
    const results: any[] = [];

    const pushResult = (item: any) => {
      results.push(item);
    };

    if (!normalized) {
      const faqResults = (db.faqs || []).map((faq: any) => ({
        id: faq.id,
        title: faq.question,
        source: "FAQ",
        category: faq.category || "FAQ",
        date: faq.updated_at || faq.created_at || new Date().toISOString(),
        snippet: faq.answer || "",
      }));
      const articleResults = (db.articles || []).map((article: any) => ({
        id: article.id,
        title: article.title,
        source: "Artikel",
        category: article.category || "Artikel",
        date: article.updated_at || article.created_at || new Date().toISOString(),
        snippet: article.content || "",
      }));
      const solutionResults = (db.products || []).map((product: any) => ({
        id: product.id,
        title: product.title,
        source: "Solusi",
        category: product.category || "Solusi",
        date: product.created_at || product.updated_at || new Date().toISOString(),
        snippet: product.description || "",
      }));
      const fileResults = (db.knowledge_files || []).map((file: any) => ({
        id: file.id,
        title: file.original_name,
        source: "Knowledge Upload",
        category: file.file_type,
        date: file.uploaded_at,
        snippet: file.error_message ? `Status: ${file.status}` : `Status: ${file.status}`,
      }));
      return [...faqResults, ...articleResults, ...solutionResults, ...fileResults];
    }

    (db.faqs || []).forEach((faq: any) => {
      if (
        faq.question?.toLowerCase().includes(normalized) ||
        faq.answer?.toLowerCase().includes(normalized)
      ) {
        pushResult({
          id: faq.id,
          title: faq.question,
          source: "FAQ",
          category: faq.category || "FAQ",
          date: faq.updated_at || faq.created_at || new Date().toISOString(),
          snippet: faq.answer || "",
        });
      }
    });

    (db.articles || []).forEach((article: any) => {
      if (
        article.title?.toLowerCase().includes(normalized) ||
        article.content?.toLowerCase().includes(normalized)
      ) {
        pushResult({
          id: article.id,
          title: article.title,
          source: "Artikel",
          category: article.category || "Artikel",
          date: article.updated_at || article.created_at || new Date().toISOString(),
          snippet: article.content || "",
        });
      }
    });

    (db.products || []).forEach((product: any) => {
      if (
        product.title?.toLowerCase().includes(normalized) ||
        product.description?.toLowerCase().includes(normalized)
      ) {
        pushResult({
          id: product.id,
          title: product.title,
          source: "Solusi",
          category: product.category || "Solusi",
          date: product.created_at || product.updated_at || new Date().toISOString(),
          snippet: product.description || "",
        });
      }
    });

    (db.knowledge_files || []).forEach((file: any) => {
      if (
        file.original_name?.toLowerCase().includes(normalized) ||
        file.filename?.toLowerCase().includes(normalized)
      ) {
        pushResult({
          id: file.id,
          title: file.original_name,
          source: "Knowledge Upload",
          category: file.file_type,
          date: file.uploaded_at,
          snippet: file.status || "",
        });
      }
    });

    const knowledgeChunks = (db.knowledge_contents || []).filter((chunk: any) =>
      chunk.content?.toLowerCase().includes(normalized),
    );
    knowledgeChunks.slice(0, 5).forEach((chunk: any) => {
      const file = (db.knowledge_files || []).find(
        (f: any) => f.id === chunk.knowledge_file_id,
      );
      pushResult({
        id: chunk.id,
        title: file ? file.original_name : "Knowledge Chunk",
        source: "Knowledge Upload",
        category: file?.file_type || "FILE",
        date: file?.uploaded_at || chunk.created_at,
        snippet: chunk.content.slice(0, 200),
      });
    });

    return results;
  }

  async getKnowledgeContext(query: string, limit = 3) {
    const db = this.db;
    const normalized = String(query || "").trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    const isTooSimilar = (text1: string, text2: string): boolean => {
      const words1 = new Set(text1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
      const words2 = new Set(text2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
      if (words1.size === 0 || words2.size === 0) return false;
      let intersection = 0;
      for (const w of words1) {
        if (words2.has(w)) intersection++;
      }
      const union = words1.size + words2.size - intersection;
      return (intersection / union) > 0.6;
    };

    const sources: Array<{ title: string; source: string; snippet: string; similarity: number }> = [];

    (db.faqs || []).forEach((faq: any) => {
      const question = faq.question || "";
      const answer = faq.answer || "";
      const text = `${question}\n${answer}`;
      if (text.toLowerCase().includes(normalized)) {
        sources.push({
          title: faq.question,
          source: "FAQ",
          snippet: answer.slice(0, 300),
          similarity: 1,
        });
      }
    });

    (db.articles || []).forEach((article: any) => {
      const text = `${article.title || ""}\n${article.content || ""}`;
      if (text.toLowerCase().includes(normalized)) {
        sources.push({
          title: article.title,
          source: "Artikel",
          snippet: (article.content || "").slice(0, 300),
          similarity: 1,
        });
      }
    });

    (db.products || []).forEach((product: any) => {
      const text = `${product.title || ""}\n${product.description || ""}`;
      if (text.toLowerCase().includes(normalized)) {
        sources.push({
          title: product.title,
          source: "Solusi",
          snippet: (product.description || "").slice(0, 300),
          similarity: 1,
        });
      }
    });

    const knowledgeCandidates: Array<{ id: string; title: string; source: string; snippet: string; similarity: number }> = [];
    if (this.geminiClient && Array.isArray(db.knowledge_embeddings) && db.knowledge_embeddings.length > 0) {
      try {
        const queryEmbedding = await this.buildEmbeddings([query]);
        const vector = queryEmbedding[0] || [];
        if (vector.length > 0) {
          db.knowledge_embeddings.forEach((entry: any) => {
            if (!Array.isArray(entry.embedding)) return;
            const similarity = this.cosineSimilarity(vector, entry.embedding);
            knowledgeCandidates.push({
              id: entry.chunk_id,
              title: entry.source_type === "KNOWLEDGE_FILE" ? entry.source_id : entry.source_type,
              source: "Knowledge Upload",
              snippet: entry.content.slice(0, 300),
              similarity,
            });
          });
        }
      } catch (err) {
        console.error("[KnowledgeService] Query embedding failed:", err);
      }
    }

    if (knowledgeCandidates.length === 0) {
      (db.knowledge_contents || []).forEach((chunk: any) => {
        if (chunk.content?.toLowerCase().includes(normalized)) {
          const file = (db.knowledge_files || []).find(
            (f: any) => f.id === chunk.knowledge_file_id,
          );
          knowledgeCandidates.push({
            id: chunk.id,
            title: file?.original_name || "Knowledge Chunk",
            source: "Knowledge Upload",
            snippet: chunk.content.slice(0, 300),
            similarity: 1,
          });
        }
      });
    }

    const allCandidates = sources.concat(knowledgeCandidates)
      .sort((a, b) => b.similarity - a.similarity);

    const uniqueCandidates: typeof allCandidates = [];
    for (const cand of allCandidates) {
      const isDup = uniqueCandidates.some(existing => 
        isTooSimilar(existing.snippet, cand.snippet) ||
        existing.snippet.toLowerCase().includes(cand.snippet.toLowerCase()) ||
        cand.snippet.toLowerCase().includes(existing.snippet.toLowerCase())
      );
      if (!isDup) {
        uniqueCandidates.push(cand);
      }
    }

    const topSources = uniqueCandidates
      .slice(0, limit)
      .map((item) => ({
        title: item.title,
        source: item.source,
        snippet: item.snippet,
      }));

    return topSources;
  }

  async retrainKnowledge() {
    const db = this.db;
    const startedAt = new Date();
    const steps: Array<{ name: string; status: "pending" | "done" | "failed" }> = [
      { name: "Mengambil FAQ", status: "pending" },
      { name: "Mengambil Artikel", status: "pending" },
      { name: "Mengambil Solusi", status: "pending" },
      { name: "Mengambil Knowledge Upload", status: "pending" },
      { name: "Membuat Embedding", status: "pending" },
      { name: "Melatih Index", status: "pending" },
      { name: "Sinkronisasi AI", status: "pending" },
    ];

    try {
      const faqs = (db.faqs || []).map((faq: any) => ({
        id: faq.id,
        source_type: "FAQ" as const,
        source_title: faq.question,
        content: `${faq.question}\n${faq.answer}`,
      }));
      steps[0].status = "done";

      const articles = (db.articles || []).map((article: any) => ({
        id: article.id,
        source_type: "ARTICLE" as const,
        source_title: article.title,
        content: `${article.title}\n${article.content}`,
      }));
      steps[1].status = "done";

      const solutions = (db.products || []).map((product: any) => ({
        id: product.id,
        source_type: "SOLUTION" as const,
        source_title: product.title,
        content: `${product.title}\n${product.description}`,
      }));
      steps[2].status = "done";

      const fileChunks = (db.knowledge_contents || []).map((chunk: any) => ({
        id: chunk.id,
        source_type: "KNOWLEDGE_FILE" as const,
        source_title: chunk.source_title,
        content: chunk.content,
      }));
      steps[3].status = "done";

      const allChunks = [...faqs, ...articles, ...solutions, ...fileChunks];
      const totalChunks = allChunks.length;

      let embeddings: number[][] = [];
      if (this.geminiClient && totalChunks > 0) {
        steps[4].status = "done";
        const contents = allChunks.map((item) => item.content);
        embeddings = await this.buildEmbeddings(contents);
      } else {
        steps[4].status = "failed";
      }

      db.knowledge_embeddings = [];
      if (embeddings.length === allChunks.length) {
        allChunks.forEach((item, index) => {
          const vector = embeddings[index] || [];
          if (vector.length === 0) return;
          db.knowledge_embeddings.push({
            id: this.createId("knowledge_emb"),
            source_type: item.source_type,
            source_id: item.id,
            chunk_id: item.id,
            content: item.content,
            embedding: vector,
            created_at: new Date().toISOString(),
          });
        });
        steps[5].status = "done";
      } else {
        steps[5].status = "failed";
      }

      if (db.knowledge_files) {
        db.knowledge_files = db.knowledge_files.map((file: any) => ({
          ...file,
          status: "INDEXED",
        }));
      }

      steps[6].status = "done";

      const finishedAt = new Date();
      const durationSeconds = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);
      const trainingLog = {
        id: this.createId("training_log"),
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        duration: durationSeconds,
        total_faq: faqs.length,
        total_articles: articles.length,
        total_solutions: solutions.length,
        total_chunks: totalChunks,
        status: "COMPLETED",
      };
      db.training_logs = db.training_logs || [];
      db.training_logs.push(trainingLog);
      if (db.knowledge_gaps) {
        db.knowledge_gaps.forEach((gap: any) => {
          gap.status = "RESOLVED";
          gap.updated_at = new Date().toISOString();
        });
      }
      this.autoResolveGaps(db);
      this.saveDb(db);

      return {
        success: true,
        message: "Training berhasil",
        totalFaq: faqs.length,
        totalArticles: articles.length,
        totalSolutions: solutions.length,
        totalKnowledgeFiles: db.knowledge_files?.length || 0,
        totalChunks,
        totalEmbeddings: db.knowledge_embeddings?.length || 0,
        duration: durationSeconds,
        trainingLog,
        steps,
      };
    } catch (err: any) {
      const finishedAt = new Date();
      const durationSeconds = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);
      const failedLog = {
        id: this.createId("training_log"),
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        duration: durationSeconds,
        total_faq: db.faqs?.length || 0,
        total_articles: db.articles?.length || 0,
        total_solutions: db.products?.length || 0,
        total_chunks: db.knowledge_contents?.length || 0,
        status: "FAILED",
      };
      db.training_logs = db.training_logs || [];
      db.training_logs.push(failedLog);
      this.saveDb(db);
      throw err;
    }
  }

  getKnowledgeAnalytics() {
    const db = this.db;
    const totalKnowledgeFiles = (db.knowledge_files || []).length;
    const totalFaq = (db.faqs || []).length;
    const totalArticles = (db.articles || []).length;
    const totalSolutions = (db.products || []).length;
    const totalChunks = (db.knowledge_contents || []).length;
    const totalEmbeddings = (db.knowledge_embeddings || []).length;
    const lastTrainingDate =
      (db.training_logs || []).slice(-1)[0]?.finished_at || null;

    return {
      totalKnowledgeFiles,
      totalFaq,
      totalArticles,
      totalSolutions,
      totalChunks,
      totalEmbeddings,
      lastTrainingDate,
    };
  }

  exportKnowledgeGaps(format: string) {
    const db = this.db;
    const gaps = db.knowledge_gaps || [];
    const rows = gaps.map((gap: any) => ({
      Question: gap.question,
      User: this.getUserName(gap.user_id),
      Frequency: gap.occurrences || 0,
      "Last Seen": gap.updated_at || gap.created_at || "",
      Status: gap.status || "OPEN",
    }));

    if (format === "JSON") {
      return {
        filename: `knowledge_gaps_${new Date().toISOString().split("T")[0]}.json`,
        contentType: "application/json",
        buffer: Buffer.from(JSON.stringify(rows, null, 2), "utf8"),
      };
    }

    const csv = [Object.keys(rows[0] || {}).join(",")].concat(
      rows.map((row: any) =>
        Object.values(row)
          .map((value) => `"${String(value || "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    );
    const csvString = csv.join("\n");

    if (format === "CSV") {
      return {
        filename: `knowledge_gaps_${new Date().toISOString().split("T")[0]}.csv`,
        contentType: "text/csv",
        buffer: Buffer.from(csvString, "utf8"),
      };
    }

    if (format === "EXCEL") {
      return this.buildExcelFile(rows, `knowledge_gaps_${new Date().toISOString().split("T")[0]}.xlsx`);
    }

    throw new Error("Format export tidak didukung");
  }

  private async buildExcelFile(rows: any[], filename: string) {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Knowledge Gaps");
    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
      rows.forEach((row) => sheet.addRow(row));
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      filename,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from(buffer),
    };
  }

  private getUserName(userId: string | null) {
    if (!userId) return "Anonymous";
    const db = this.db;
    const user = (db.users || []).find((u: any) => u.id === userId);
    return user?.name || user?.email || "Anonymous";
  }

  private autoResolveGaps(db: any) {
    const gaps = db.knowledge_gaps || [];
    const chunks = db.knowledge_contents || [];
    const faqs = db.faqs || [];
    const products = db.products || [];
    const articles = db.articles || [];

    // Stop words to ignore during keyword matching
    const stopWords = new Set([
      "apa", "itu", "bagaimana", "cara", "yang", "di", "ke", "dari", "dan", "atau",
      "adalah", "ini", "itu", "untuk", "dengan", "pada", "oleh", "sorgum", "sorgummi",
      "tanaman", "bisa", "apakah", "bagaimanakah", "tahu", "mengapa", "kenapa", "saja", "bagaimana"
    ]);

    gaps.forEach((gap: any) => {
      if (gap.status === "RESOLVED") return;

      const questionText = String(gap.question || "").toLowerCase();
      // Clean and extract keywords from the gap question
      const keywords = questionText
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

      if (keywords.length === 0) return;

      // Check if any chunk, faq, product, or article covers these keywords
      const isCovered = (text: string) => {
        const lowerText = text.toLowerCase();
        // Option A: Direct substring match of the full clean question
        const cleanQuestion = questionText.replace(/[^\w\s]/g, "").trim();
        if (cleanQuestion.length > 5 && lowerText.includes(cleanQuestion)) {
          return true;
        }
        // Option B: At least 70% of keywords are found in the text (min 1 keyword)
        const matchedKeywords = keywords.filter(word => lowerText.includes(word));
        const matchRatio = matchedKeywords.length / keywords.length;
        return matchRatio >= 0.7 && matchedKeywords.length >= 1;
      };

      // Scan all content sources
      const foundInChunks = chunks.some((c: any) => isCovered(c.content || ""));
      const foundInFaqs = faqs.some((f: any) => isCovered((f.question || "") + " " + (f.answer || "")));
      const foundInProducts = products.some((p: any) => isCovered((p.title || "") + " " + (p.description || "")));
      const foundInArticles = articles.some((a: any) => isCovered((a.title || "") + " " + (a.content || "")));

      if (foundInChunks || foundInFaqs || foundInProducts || foundInArticles) {
        gap.status = "RESOLVED";
        gap.updated_at = new Date().toISOString();
        console.log(`[KnowledgeService] Auto-resolved gap: "${gap.question}"`);
      }
    });
  }
}
