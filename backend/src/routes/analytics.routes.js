import { Router } from 'express';
import { getOverview, getBranchAnalytics, getGenerationAnalytics, getMissingData } from '../services/analytics.service.js';

const router = Router();

router.get('/overview', (_req, res) => {
  res.json(getOverview());
});

router.get('/branches', (_req, res) => {
  res.json(getBranchAnalytics());
});

router.get('/generations', (_req, res) => {
  res.json(getGenerationAnalytics());
});

router.get('/missing', (_req, res) => {
  res.json(getMissingData());
});

export default router;
