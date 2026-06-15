import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController.ts';

export default function createAnalyticsRoutes(pool: any, getData: () => any, saveData: (data: any) => void) {
  const router = express.Router();
  const controller = new AnalyticsController(pool, getData, saveData);

  router.get('/dashboard', controller.getDashboardSummary);
  router.get('/users', controller.getUsersAnalytics);
  router.get('/ai', controller.getAIAnalytics);
  router.get('/articles', controller.getArticlesAnalytics);
  router.get('/education', controller.getEducationAnalytics);
  router.get('/feedback', controller.getFeedbackAnalytics);
  router.get('/charts', controller.getChartAnalytics);
  router.get('/export/csv', controller.exportCsv);
  router.get('/export/pdf', controller.exportPdf);

  return router;
}
