import { Request, Response } from "express";
import { KnowledgeService } from "../services/knowledgeService";

export class KnowledgeController {
  private service: KnowledgeService;

  constructor(getData: () => any, saveData: (data: any) => void) {
    this.service = new KnowledgeService(getData, saveData);
  }

  uploadKnowledge = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "File tidak ditemukan.",
        });
      }

      const uploadedBy = String(req.body.uploadedBy || "Administrator");
      const result = await this.service.uploadKnowledgeFile(req.file, uploadedBy);
      return res.json({ status: "success", data: result });
    } catch (error: any) {
      console.error("[Knowledge] uploadKnowledge error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mengunggah knowledge: " + (error.message || error),
      });
    }
  };

  getKnowledgeFiles = async (req: Request, res: Response) => {
    try {
      const files = this.service.listKnowledgeFiles();
      return res.json({ status: "success", data: files });
    } catch (error: any) {
      console.error("[Knowledge] getKnowledgeFiles error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mengambil daftar knowledge files: " +
          (error.message || error),
      });
    }
  };

  searchKnowledge = async (req: Request, res: Response) => {
    try {
      const query = String(req.query.q || "");
      const results = this.service.searchKnowledge(query);
      return res.json({ status: "success", data: results });
    } catch (error: any) {
      console.error("[Knowledge] searchKnowledge error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mencari knowledge: " + (error.message || error),
      });
    }
  };

  deleteKnowledgeFile = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      await this.service.deleteKnowledgeFile(id);
      return res.json({
        status: "success",
        message: "Knowledge file berhasil dihapus.",
      });
    } catch (error: any) {
      console.error("[Knowledge] deleteKnowledgeFile error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal menghapus knowledge file: " +
          (error.message || error),
      });
    }
  };

  retrainKnowledge = async (req: Request, res: Response) => {
    try {
      const result = await this.service.retrainKnowledge();
      return res.json({ status: "success", data: result });
    } catch (error: any) {
      console.error("[Knowledge] retrainKnowledge error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal melatih ulang knowledge: " +
          (error.message || error),
      });
    }
  };

  getAnalytics = async (req: Request, res: Response) => {
    try {
      const analytics = this.service.getKnowledgeAnalytics();
      return res.json({ status: "success", data: analytics });
    } catch (error: any) {
      console.error("[Knowledge] getAnalytics error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mengambil analytics: " + (error.message || error),
      });
    }
  };

  exportGaps = async (req: Request, res: Response) => {
    try {
      const format = String((req.query.format as string) || "JSON").toUpperCase();
      const file = await this.service.exportKnowledgeGaps(format);
      res.setHeader("Content-Type", file.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
      return res.send(file.buffer);
    } catch (error: any) {
      console.error("[Knowledge] exportGaps error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mengekspor knowledge gaps: " +
          (error.message || error),
      });
    }
  };
}
