import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService.ts';
import PDFDocument from 'pdfkit';

export class AnalyticsController {
  private service: AnalyticsService;

  constructor(pool: any, getData: () => any, saveData: (data: any) => void) {
    this.service = new AnalyticsService(pool, getData, saveData);
  }

  getDashboardSummary = async (req: Request, res: Response) => {
    try {
      const period = String(req.query.period || '7d');
      const result = await this.service.getDashboardSummary(period);
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Analytics] getDashboardSummary', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil ringkasan analytics' });
    }
  };

  getUsersAnalytics = async (req: Request, res: Response) => {
    try {
      const period = String(req.query.period || '7d');
      const result = await this.service.getUsersAnalytics(period);
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Analytics] getUsersAnalytics', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil analytics pengguna' });
    }
  };

  getAIAnalytics = async (req: Request, res: Response) => {
    try {
      const period = String(req.query.period || '7d');
      const result = await this.service.getAIAnalytics(period);
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Analytics] getAIAnalytics', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil analytics AI' });
    }
  };

  getArticlesAnalytics = async (req: Request, res: Response) => {
    try {
      const period = String(req.query.period || '7d');
      const result = await this.service.getArticlesAnalytics(period);
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Analytics] getArticlesAnalytics', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil analytics artikel' });
    }
  };

  getEducationAnalytics = async (req: Request, res: Response) => {
    try {
      const period = String(req.query.period || '7d');
      const result = await this.service.getEducationAnalytics(period);
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Analytics] getEducationAnalytics', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil analytics edukasi' });
    }
  };

  getFeedbackAnalytics = async (req: Request, res: Response) => {
    try {
      const period = String(req.query.period || '7d');
      const result = await this.service.getFeedbackAnalytics(period);
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Analytics] getFeedbackAnalytics', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil analytics feedback' });
    }
  };

  getChartAnalytics = async (req: Request, res: Response) => {
    try {
      const period = String(req.query.period || '7d');
      const result = await this.service.getChartAnalytics(period);
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Analytics] getChartAnalytics', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil grafik analytics' });
    }
  };

  exportCsv = async (req: Request, res: Response) => {
    try {
      const period = String(req.query.period || '7d');
      const csv = await this.service.buildAnalyticsCsv(period);
      const filename = `analytics_report_${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csv);
    } catch (err: any) {
      console.error('[Analytics] exportCsv', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengekspor CSV' });
    }
  };

  exportPdf = async (req: Request, res: Response) => {
    try {
      const period = String(req.query.period || '7d');
      const summary = await this.service.getDashboardSummary(period);
      const charts = await this.service.getChartAnalytics(period);
      const filename = `analytics_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.on('error', (error) => {
        console.error('[Analytics] exportPdf document error', error);
        if (!res.headersSent) {
          res.status(500).json({ status: 'error', message: 'Gagal mengekspor PDF' });
        }
      });
      res.on('close', () => {
        if (!doc.destroyed) {
          doc.destroy();
        }
      });

      doc.pipe(res);
      doc.fontSize(18).fillColor('#111').text('Laporan Statistik & Analitik', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(10).fillColor('#333').text(`Periode: ${summary.periodLabel}`, { align: 'center' });
      doc.text(`Dibuat pada: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.5);

      const writeSection = (title: string, values: Array<{ label: string; value: string }>) => {
        doc.fontSize(12).fillColor('#000').text(title, { underline: true });
        doc.moveDown(0.3);
        values.forEach((item) => {
          doc.fontSize(10).fillColor('#333').text(`${item.label}: ${item.value}`);
        });
        doc.moveDown(0.8);
      };

      writeSection('Ringkasan Pengguna', [
        { label: 'Total Pengguna', value: String(summary.users.totalUsers) },
        { label: 'Aktif Hari Ini', value: String(summary.users.activeToday) },
        { label: 'Baru Bulan Ini', value: String(summary.users.newThisMonth) },
        { label: 'Tingkat Retensi', value: `${summary.users.retentionRate}%` },
      ]);

      writeSection('Performa AI', [
        { label: 'Total Interaksi', value: String(summary.ai.totalInteractions) },
        { label: 'Success Rate', value: `${summary.ai.successRate}%` },
        { label: 'Rata-rata Latensi', value: `${summary.ai.avgLatency} ms` },
        { label: 'Total Gagal', value: String(summary.ai.totalFailed) },
        { label: 'Total Tak Terjawab', value: String(summary.ai.totalUnanswered || 0) },
      ]);

      writeSection('Konten Artikel & Edukasi', [
        { label: 'Total Artikel', value: String(summary.articles.totalArticles) },
        { label: 'Total Views Artikel', value: String(summary.articles.totalArticleViews) },
        { label: 'Total Edukasi', value: String(summary.education.totalEducation) },
        { label: 'Total Views Edukasi', value: String(summary.education.totalEducationViews) },
      ]);

      writeSection('Feedback', [
        { label: 'Total Feedback', value: String(summary.feedback.totalFeedback) },
        { label: 'Positif', value: String(summary.feedback.positive) },
        { label: 'Netral', value: String(summary.feedback.neutral) },
        { label: 'Negatif', value: String(summary.feedback.negative) },
        { label: 'Nilai Sentimen', value: String(summary.feedback.sentimentScore) },
      ]);

      doc.addPage();
      doc.fontSize(14).fillColor('#000').text('Top Artikel', { underline: true });
      summary.articles.topArticles.slice(0, 8).forEach((item) => {
        const growthText = item.growth ? ` (${item.growth})` : '';
        doc.fontSize(10).fillColor('#333').text(`${item.title} — ${item.views} views${growthText}`, { indent: 10 });
      });
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor('#000').text('Top Edukasi', { underline: true });
      summary.education.topEducation.slice(0, 8).forEach((item) => {
        const ratingText = item.rating ? ` • Rating ${item.rating.toFixed(1)}` : '';
        doc.fontSize(10).fillColor('#333').text(`${item.title} — ${item.views} views${ratingText}`, { indent: 10 });
      });
      doc.moveDown(0.8);

      const writeChartData = (title: string, data: any[]) => {
        doc.fontSize(14).fillColor('#000').text(title, { underline: true });
        doc.moveDown(0.3);
        if (!data.length) {
          doc.fontSize(10).fillColor('#333').text('Belum ada data grafik tersedia.', { indent: 10 });
        } else {
          data.forEach((point) => {
            doc.fontSize(10).fillColor('#333').text(`${point.name}: ${point.value}`, { indent: 10 });
          });
        }
        doc.moveDown(0.5);
      };

      writeChartData('Grafik Pertumbuhan Pengguna Terdaftar', charts.users);
      writeChartData('Grafik Volume Chat AI', charts.ai);
      writeChartData('Grafik Tren Artikel Dibaca', charts.articles);
      writeChartData('Grafik Aktivitas Penayangan Edukasi', charts.education);

      doc.end();
    } catch (err: any) {
      console.error('[Analytics] exportPdf', err);
      if (!res.headersSent) {
        return res.status(500).json({ status: 'error', message: 'Gagal mengekspor PDF' });
      }
    }
  };
}
