import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../config/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validate, memberCreateSchema, memberUpdateSchema, extraFieldSchema } from '../utils/validators.js';
import { generateMemberId } from '../utils/idGenerator.js';
import { getMemberById } from '../services/tree.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
    }
  },
});

router.get('/', (req, res) => {
  const db = getDb();
  const { q } = req.query;

  if (q && q.trim()) {
    const pattern = `%${q.trim()}%`;
    const members = db.prepare(`
      SELECT id, name_np, name_en, spouse_np, spouse_en, gender, generation_level, family_branch_root, parent_id, image_path
      FROM members
      WHERE name_np LIKE ? OR name_en LIKE ? OR spouse_np LIKE ? OR spouse_en LIKE ?
      ORDER BY generation_level, name_en
      LIMIT 50
    `).all(pattern, pattern, pattern, pattern);
    return res.json(members);
  }

  const members = db.prepare(`
    SELECT id, name_np, name_en, spouse_np, spouse_en, gender, generation_level, family_branch_root, parent_id, image_path
    FROM members ORDER BY generation_level, name_en
  `).all();
  res.json(members);
});

router.get('/:id', (req, res) => {
  const member = getMemberById(req.params.id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }
  res.json(member);
});

router.post('/', authenticateToken, requireAdmin, validate(memberCreateSchema), (req, res) => {
  const db = getDb();
  const data = req.validated;

  const parent = db.prepare('SELECT id, generation_level, family_branch_root FROM members WHERE id = ?').get(data.parent_id);
  if (!parent) {
    return res.status(400).json({ error: 'Parent not found' });
  }

  const id = generateMemberId();
  const gender = data.relationship === 'daughter' ? 'female' : 'male';
  const genLevel = parent.generation_level + 1;

  let branchRoot = parent.family_branch_root;
  if (parent.generation_level === 2) {
    branchRoot = data.name_en || '';
  }

  db.prepare(`
    INSERT INTO members (id, name_np, name_en, spouse_np, spouse_en, parent_id, relationship, gender, generation_level, family_branch_root, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.name_np, data.name_en, data.spouse_np || '', data.spouse_en || '', data.parent_id, data.relationship, gender, genLevel, branchRoot, data.notes || '');

  const member = getMemberById(id);
  res.status(201).json(member);
});

router.put('/:id', authenticateToken, requireAdmin, validate(memberUpdateSchema), (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const data = req.validated;

  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const updates = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);

      if (key === 'relationship') {
        updates.push('gender = ?');
        values.push(value === 'daughter' ? 'female' : 'male');
      }
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE members SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const member = getMemberById(id);
  res.json(member);
});

router.post('/:id/image', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const db = getDb();
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM members WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const imagePath = `/uploads/${req.file.filename}`;
  db.prepare("UPDATE members SET image_path = ?, updated_at = datetime('now') WHERE id = ?").run(imagePath, id);

  res.json({ image_path: imagePath });
});

router.post('/:id/extras', authenticateToken, requireAdmin, validate(extraFieldSchema), (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { fields } = req.validated;

  const existing = db.prepare('SELECT id FROM members WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const upsert = db.prepare(`
    INSERT INTO member_extra (member_id, field_key, field_value) VALUES (?, ?, ?)
    ON CONFLICT(member_id, field_key) DO UPDATE SET field_value = excluded.field_value
  `);

  const upsertAll = db.transaction(() => {
    for (const f of fields) {
      upsert.run(id, f.field_key, f.field_value);
    }
  });
  upsertAll();

  const extras = db.prepare('SELECT field_key, field_value FROM member_extra WHERE member_id = ?').all(id);
  res.json({ extras: Object.fromEntries(extras.map(e => [e.field_key, e.field_value])) });
});

export default router;
