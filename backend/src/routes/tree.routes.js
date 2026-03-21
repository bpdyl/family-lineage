import { Router } from 'express';
import { buildNestedTree, getAncestorPath, exportTreeAsJson } from '../services/tree.service.js';

const router = Router();

router.get('/', (_req, res) => {
  const tree = buildNestedTree();
  res.json(tree);
});

router.get('/export', (_req, res) => {
  const tree = exportTreeAsJson();
  res.json(tree);
});

router.get('/subtree/:id', (req, res) => {
  const tree = buildNestedTree(req.params.id);
  if (!tree) {
    return res.status(404).json({ error: 'Member not found' });
  }
  res.json(tree);
});

router.get('/ancestor-path/:id', (req, res) => {
  const path = getAncestorPath(req.params.id);
  if (!path || path.length === 0) {
    return res.status(404).json({ error: 'Member not found' });
  }
  res.json(path);
});

export default router;
