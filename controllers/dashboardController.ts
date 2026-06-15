import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService.ts';

export class DashboardController {
  private service: DashboardService;

  constructor(pool: any, getData: () => any, saveData: (data: any) => void) {
    this.service = new DashboardService(pool, getData, saveData);
  }

  getUsersCount = async (req: Request, res: Response) => {
    try {
      const result = await this.service.getUsersCount();
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Dashboard] getUsersCount', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil jumlah pengguna' });
    }
  };

  getChatCount = async (req: Request, res: Response) => {
    try {
      const result = await this.service.getChatCount();
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Dashboard] getChatCount', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil jumlah konsultasi AI' });
    }
  };

  getArticlesCount = async (req: Request, res: Response) => {
    try {
      const result = await this.service.getArticlesCount();
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Dashboard] getArticlesCount', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil jumlah artikel' });
    }
  };

  getKnowledgeGaps = async (req: Request, res: Response) => {
    try {
      const result = await this.service.getKnowledgeGaps();
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Dashboard] getKnowledgeGaps', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil knowledge gaps' });
    }
  };

  getActivityChart = async (req: Request, res: Response) => {
    try {
      const result = await this.service.getActivityChart();
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Dashboard] getActivityChart', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil data aktivitas' });
    }
  };

  getTopCategories = async (req: Request, res: Response) => {
    try {
      const result = await this.service.getTopCategories();
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Dashboard] getTopCategories', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil top kategori' });
    }
  };

  getActivityTypes = async (req: Request, res: Response) => {
    try {
      const result = await this.service.getActivityTypes();
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Dashboard] getActivityTypes', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil tipe aktivitas' });
    }
  };

  getPopularTopics = async (req: Request, res: Response) => {
    try {
      const result = await this.service.getPopularTopics();
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Dashboard] getPopularTopics', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil topik populer' });
    }
  };

  getRecentActivities = async (req: Request, res: Response) => {
    try {
      const result = await this.service.getRecentActivities();
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Dashboard] getRecentActivities', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil aktivitas terbaru' });
    }
  };

  getActivityLogs = async (req: Request, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const perPage = Number(req.query.perPage) || 10;
      const result = await this.service.getActivityLogs(page, perPage);
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Dashboard] getActivityLogs', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil log aktivitas' });
    }
  };

  getAIStatus = async (req: Request, res: Response) => {
    try {
      const result = await this.service.getAIStatus();
      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('[Dashboard] getAIStatus', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil status AI' });
    }
  };
}
