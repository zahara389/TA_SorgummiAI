import express from "express";
import { AIMonitoringController } from "../controllers/aiMonitoringController";

export default function createAIMonitoringRoutes(
  getData: () => any,
  saveData: (data: any) => void,
) {
  const router = express.Router();
  const controller = new AIMonitoringController(getData, saveData);

  router.get("/metrics", controller.getMetrics);
  router.get("/interactions", controller.getInteractions);
  router.get("/knowledge-gaps", controller.getKnowledgeGaps);
  router.post("/retrain", controller.retrainAI);
  router.get("/status", controller.getStatus);
  router.get("/export", controller.exportData);
  router.post("/log-interaction", controller.logInteraction);

  return router;
}
