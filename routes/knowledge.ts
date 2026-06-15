import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { KnowledgeController } from "../controllers/knowledgeController";

type DataAccessor = {
  getData: () => any;
  saveData: (data: any) => void;
};

export default function createKnowledgeRoutes(
  getData: () => any,
  saveData: (data: any) => void,
) {
  const router = express.Router();
  const controller = new KnowledgeController(getData, saveData);
  const uploadDir = path.join(process.cwd(), "uploads", "knowledge");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const db = getData();
      const extension = path.extname(file.originalname).toLowerCase();
      const originalName = file.originalname || "knowledge";
      const baseName = originalName.replace(extension, "");
      const sanitized = baseName
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 220);
      const existingVersions = (db.knowledge_files || []).filter(
        (f: any) => f.original_name === originalName,
      ).length;
      const version = existingVersions + 1;
      const filename = `${sanitized}_v${version}${extension}`;
      cb(null, filename);
    },
  });

  const fileFilter = (_req: any, file: any, cb: any) => {
    const allowed = /\.pdf$|\.doc$|\.docx$|\.txt$|\.json$|\.csv$/i;
    if (!allowed.test(file.originalname)) {
      return cb(new Error("Hanya file PDF, DOC, DOCX, TXT, JSON, dan CSV yang diperbolehkan."));
    }
    cb(null, true);
  };

  const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter,
  });

  router.post("/upload", upload.single("file"), controller.uploadKnowledge);
  router.get("/files", controller.getKnowledgeFiles);
  router.get("/search", controller.searchKnowledge);
  router.delete("/:id", controller.deleteKnowledgeFile);
  router.post("/retrain", controller.retrainKnowledge);
  router.get("/analytics", controller.getAnalytics);
  router.get("/export-gaps", controller.exportGaps);

  return router;
}
