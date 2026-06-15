import { Request, Response } from "express";
import { AIMonitoringService } from "../services/aiMonitoringService";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

export class AIMonitoringController {
  private service: AIMonitoringService;

  constructor(getData: () => any, saveData: (data: any) => void) {
    this.service = new AIMonitoringService(getData, saveData);
  }

  /**
   * GET /api/ai-monitoring/metrics
   * Returns: Real-time AI performance metrics
   */
  getMetrics = async (req: Request, res: Response) => {
    try {
      const metrics = this.service.getMetrics();
      return res.json({ status: "success", data: metrics });
    } catch (error: any) {
      console.error("[AIMonitoring] getMetrics error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mengambil metrik AI: " + error.message,
      });
    }
  };

  /**
   * GET /api/chat/analytics
   * Returns: Full chatbot stats (today's stats, charts, metrics)
   */
  getAnalytics = async (req: Request, res: Response) => {
    try {
      const analytics = this.service.getAnalytics();
      return res.json({ status: "success", data: analytics });
    } catch (error: any) {
      console.error("[AIMonitoring] getAnalytics error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mengambil analitik chatbot: " + error.message,
      });
    }
  };

  /**
   * GET /api/chat/detail/:id
   * Returns: Detailed chat interaction log by ID
   */
  getDetail = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const db = this.service["getData"]();
      const log = (db.chat_logs || []).find((l: any) => String(l.id) === String(id));
      if (!log) {
        return res.status(404).json({
          status: "error",
          message: "Detail interaksi tidak ditemukan.",
        });
      }

      const user = db.users?.find(
        (u: any) => String(u.id) === String(log.user_id),
      );

      // Log activity
      if (!db.activity_logs) db.activity_logs = [];
      db.activity_logs.push({
        id: Math.random().toString(36).substr(2, 9),
        type: "AI Chatbot Monitoring",
        action: "Detail dibuka",
        details: `Membuka detail interaksi ID: ${id}`,
        user_email: "Admin",
        created_at: new Date().toISOString(),
      });
      this.service["saveData"](db);

      return res.json({
        status: "success",
        data: {
          id: log.id,
          user: user?.name || log.user_name || "Unknown User",
          email: user?.email || log.user_email || "Anonymous",
          message: log.question || "",
          aiResponse: log.answer || "",
          prompt: log.prompt || "N/A",
          raw_response: log.raw_response ? JSON.parse(JSON.stringify(log.raw_response)) : "N/A",
          latency: log.latency || 0,
          tokens: log.tokens || 0,
          timestamp: log.created_at,
          status: log.status || "UNKNOWN",
          errorMessage: log.error_message || null,
          errorStack: log.error_stack || null,
          errorCode: log.error_code || null,
        },
      });
    } catch (error: any) {
      console.error("[AIMonitoring] getDetail error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mengambil detail interaksi: " + error.message,
      });
    }
  };

  /**
   * GET /api/ai-monitoring/interactions
   * Query Parameters: page, limit, search, status, timeRange
   * Returns: Paginated chat interactions with filtering
   */
  getInteractions = async (req: Request, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = String(req.query.search || "").trim();
      const status = String(req.query.status || "").trim();
      const timeRange = String(req.query.timeRange || "").trim();

      // Get all interactions
      const result = this.service.getInteractions(page, 1000); // Get all for filtering
      let interactions = result.data;

      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      // Apply search filter
      if (search) {
        const query = search.toLowerCase();
        interactions = interactions.filter(
          (i) =>
            i.user.toLowerCase().includes(query) ||
            (i.email && i.email.toLowerCase().includes(query)) ||
            i.message.toLowerCase().includes(query) ||
            i.aiResponse.toLowerCase().includes(query),
        );
      }

      // Apply status filter
      if (status && status !== "Semua") {
        interactions = interactions.filter((i) => i.status === status);
      }

      // Apply time range filter
      if (timeRange === "Hari ini") {
        interactions = interactions.filter((i) => {
          const createdAt = new Date(i.timestamp);
          return createdAt >= startOfToday;
        });
      } else if (timeRange === "Minggu ini" || timeRange === "7 Hari") {
        const startOf7DaysAgo = new Date(now);
        startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);
        startOf7DaysAgo.setHours(0, 0, 0, 0);
        interactions = interactions.filter((i) => {
          const createdAt = new Date(i.timestamp);
          return createdAt >= startOf7DaysAgo;
        });
      } else if (timeRange === "30 Hari") {
        const startOf30DaysAgo = new Date(now);
        startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30);
        startOf30DaysAgo.setHours(0, 0, 0, 0);
        interactions = interactions.filter((i) => {
          const createdAt = new Date(i.timestamp);
          return createdAt >= startOf30DaysAgo;
        });
      }

      // Paginate
      const total = interactions.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const paginated = interactions.slice(start, start + limit);

      return res.json({
        status: "success",
        data: paginated,
        total,
        page,
        limit,
        totalPages,
      });
    } catch (error: any) {
      console.error("[AIMonitoring] getInteractions error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mengambil interaksi chatbot: " + error.message,
      });
    }
  };

  /**
   * GET /api/ai-monitoring/knowledge-gaps
   * Returns: All detected knowledge gaps
   */
  getKnowledgeGaps = async (req: Request, res: Response) => {
    try {
      const gaps = this.service.getKnowledgeGaps();
      return res.json({
        status: "success",
        data: gaps,
        total: gaps.length,
      });
    } catch (error: any) {
      console.error("[AIMonitoring] getKnowledgeGaps error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mengambil knowledge gaps: " + error.message,
      });
    }
  };

  /**
   * POST /api/ai-monitoring/retrain
   * Body: { gapId?: string }
   * Returns: Training result
   */
  retrainAI = async (req: Request, res: Response) => {
    try {
      const { gapId } = req.body;

      console.log("[AIMonitoring] Starting AI retrain. Gap ID:", gapId);

      const result = await this.service.retrainAI(gapId);

      return res.json({
        status: "success",
        data: result,
        message: "AI berhasil dilatih ulang",
      });
    } catch (error: any) {
      console.error("[AIMonitoring] retrainAI error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal melatih ulang AI: " + error.message,
      });
    }
  };

  /**
   * GET /api/ai-monitoring/status
   * Returns: Real-time AI and Gemini API status
   */
  getStatus = async (req: Request, res: Response) => {
    try {
      const geminiStatus = await this.service.checkGeminiStatus();
      const metrics = this.service.getMetrics();

      return res.json({
        status: "success",
        data: {
          gemini: {
            status: geminiStatus.status,
            latency: geminiStatus.latency,
          },
          metrics,
        },
      });
    } catch (error: any) {
      console.error("[AIMonitoring] getStatus error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mengambil status AI: " + error.message,
      });
    }
  };

  /**
   * GET /api/ai-monitoring/export
   * Query Parameters: format (CSV or EXCEL)
   * Returns: File download of interactions
   */
  exportData = async (req: Request, res: Response) => {
    try {
      const format =
        String(req.query.format || req.body.format || "CSV").toUpperCase();

      if (!["CSV", "EXCEL", "PDF"].includes(format)) {
        return res.status(400).json({
          status: "error",
          message: "Format harus CSV, EXCEL, atau PDF",
        });
      }

      const db = this.service["getData"]();
      const logs = db.chat_logs || [];
      const filename = `ai_monitoring_${new Date().toISOString().split("T")[0]}.${
        format === "EXCEL" ? "xlsx" : format === "PDF" ? "pdf" : "csv"
      }`;

      // Log activity
      if (!db.activity_logs) db.activity_logs = [];
      db.activity_logs.push({
        id: Math.random().toString(36).substr(2, 9),
        type: "AI Chatbot Monitoring",
        action: "Export",
        details: `Mengekspor data riwayat interaksi chatbot format ${format}`,
        user_email: "Admin",
        created_at: new Date().toISOString(),
      });
      this.service["saveData"](db);

      if (format === "CSV") {
        const csvData = this.service.exportInteractions("CSV");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.send(csvData);
      }

      if (format === "EXCEL") {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Chat Interactions");

        sheet.columns = [
          { header: "User", key: "user", width: 20 },
          { header: "Email", key: "email", width: 25 },
          { header: "Pertanyaan", key: "question", width: 45 },
          { header: "Jawaban AI", key: "answer", width: 55 },
          { header: "Latency (ms)", key: "latency", width: 15 },
          { header: "Token", key: "token", width: 12 },
          { header: "Waktu", key: "created_at", width: 22 },
          { header: "Status", key: "status", width: 12 },
        ];

        logs.forEach((log: any) => {
          const user = db.users?.find(
            (u: any) => String(u.id) === String(log.user_id),
          );
          sheet.addRow({
            user: user?.name || log.user_name || "Unknown User",
            email: user?.email || log.user_email || "Anonymous",
            question: log.question || "",
            answer: log.answer || "",
            latency: log.latency || 0,
            token: log.tokens || 0,
            created_at: new Date(log.created_at).toLocaleString(),
            status: log.status || "UNKNOWN",
          });
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        const buffer = await workbook.xlsx.writeBuffer();
        return res.send(Buffer.from(buffer));
      }

      if (format === "PDF") {
        const doc = new PDFDocument({ margin: 30 });
        const buffers: any[] = [];
        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
          res.send(pdfBuffer);
        });

        doc.fontSize(16).text("Laporan Riwayat Interaksi Chatbot AI", {
          align: "center",
        });
        doc.moveDown();
        doc.fontSize(10).text(
          `Total Records: ${logs.length} | Dibuat pada: ${new Date().toLocaleString()}`,
          { align: "center" },
        );
        doc.moveDown(2);

        logs.forEach((log: any, index: number) => {
          const user = db.users?.find(
            (u: any) => String(u.id) === String(log.user_id),
          );
          const userName = user?.name || log.user_name || "Unknown User";
          const userEmail = user?.email || log.user_email || "Anonymous";

          doc.fontSize(10).font("Helvetica-Bold").text(
            `${index + 1}. User: ${userName} (${userEmail})`,
          );
          doc.fontSize(9).font("Helvetica-Oblique").text(
            `Waktu: ${new Date(log.created_at).toLocaleString()} | Latency: ${
              log.latency
            }ms | Token: ${log.tokens} | Status: ${log.status}`,
          );
          doc.fontSize(9).font("Helvetica").text(`T: ${log.question}`);
          doc.fontSize(9).font("Helvetica-Bold").text(`J: ${log.answer}`);
          doc.moveDown();
        });

        doc.end();
        return;
      }
    } catch (error: any) {
      console.error("[AIMonitoring] exportData error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mengekspor data: " + error.message,
      });
    }
  };

  /**
   * POST /api/ai-monitoring/log-interaction
   * Body: { userId, question, answer, status, latency, tokens, confidence }
   * Internal use: Called by chatbot after each interaction
   */
  logInteraction = async (req: Request, res: Response) => {
    try {
      const {
        userId,
        question,
        answer,
        status,
        latency,
        tokens,
        confidence,
        errorMessage,
      } = req.body;

      // Validate required fields
      if (!question || !answer || !status) {
        return res.status(400).json({
          status: "error",
          message: "question, answer, dan status wajib diisi",
        });
      }

      const result = this.service.logInteraction(
        userId || null,
        question,
        answer,
        status,
        latency || 0,
        tokens || 0,
        confidence || 0,
        errorMessage || null,
      );

      return res.json({
        status: "success",
        data: result,
        message: "Interaksi berhasil dicatat",
      });
    } catch (error: any) {
      console.error("[AIMonitoring] logInteraction error:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mencatat interaksi: " + error.message,
      });
    }
  };
}
