import { Router } from 'express';
import { findPath, resolveRelationship } from '../services/graph.service.js';

const router = Router();

router.get('/path', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'Both "from" and "to" query parameters are required' });
  }

  const path = findPath(from, to);
  if (!path) {
    return res.status(404).json({ error: 'No path found between the two members' });
  }

  res.json({ path, length: path.length });
});

router.get('/relationship', (req, res) => {
  const { a, b } = req.query;
  if (!a || !b) {
    return res.status(400).json({ error: 'Both "a" and "b" query parameters are required' });
  }

  const result = resolveRelationship(a, b);
  if (!result) {
    return res.status(404).json({ error: 'One or both members not found' });
  }

  res.json(result);
});

export default router;
