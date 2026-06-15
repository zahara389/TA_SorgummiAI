import express from 'express';
import { DashboardController } from '../controllers/dashboardController.ts';

export default function createDashboardRoutes(pool: any, getData: () => any, saveData: (data: any) => void) {
  const router = express.Router();
  const controller = new DashboardController(pool, getData, saveData);

  router.get('/users/count', controller.getUsersCount);
  router.get('/chat/count', controller.getChatCount);
  router.get('/articles/count', controller.getArticlesCount);
  router.get('/knowledge-gaps', controller.getKnowledgeGaps);
  router.get('/activity-chart', controller.getActivityChart);
  router.get('/activity', controller.getActivityLogs);
  router.get('/activity-logs', controller.getActivityLogs);
  router.get('/top-categories', controller.getTopCategories);
  router.get('/categories', controller.getTopCategories);
  router.get('/activity-types', controller.getActivityTypes);
  router.get('/popular-topics', controller.getPopularTopics);
  router.get('/recent-activities', controller.getRecentActivities);
  router.get('/recent', controller.getRecentActivities);
  router.get('/ai-status', controller.getAIStatus);

  return router;
}
