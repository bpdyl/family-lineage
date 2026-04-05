import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildNestedTree, getAncestorPath, exportTreeAsJson, exportTreeAsSeedJson } from '../services/tree.service.js';
import { importFamilyData, cleanupDuplicatePlaceholders } from '../services/import.service.js';
import { getDb } from '../config/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { uploadBackup, isGdriveConfigured, downloadBackup } from '../services/gdrive.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE_PATH = path.join(__dirname, '..', '..', '..', 'family_lineage.json');

const router = Router();

async function loadSeedPayload() {
  if (fs.existsSync(SEED_FILE_PATH)) {
    const raw = fs.readFileSync(SEED_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  }

  if (isGdriveConfigured()) {
    return await downloadBackup();
  }

  return null;
}

router.get('/', (_req, res) => {
  const tree = buildNestedTree();
  res.json(tree);
});

router.get('/export', authenticateToken, requireAdmin, (_req, res) => {
  const tree = exportTreeAsJson();
  res.json(tree);
});

// Export in seed-compatible format (same schema as family_lineage.json)
router.get('/export/seed', authenticateToken, requireAdmin, (_req, res) => {
  const seedData = exportTreeAsSeedJson();
  res.json(seedData);
});

// Sync current DB state back to family_lineage.json so seed file stays up-to-date
router.post('/sync-seed', authenticateToken, requireAdmin, (_req, res) => {
  try {
    const seedData = exportTreeAsSeedJson();
    fs.writeFileSync(SEED_FILE_PATH, JSON.stringify(seedData, null, 4), 'utf-8');
    res.json({ message: 'Seed file synced successfully', path: 'family_lineage.json' });
  } catch (err) {
    console.error('Failed to sync seed file:', err);
    res.status(500).json({ error: 'Failed to sync seed file' });
  }
});

// Import family_lineage.json into DB with idempotent merge behavior
router.post('/import-seed', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const payload = await loadSeedPayload();

    if (!payload || !payload.family_tree) {
      return res.status(400).json({ error: 'No valid family_lineage.json payload found locally or on Google Drive.' });
    }

    const db = getDb();
    const importTx = db.transaction(() => importFamilyData(db, payload));
    const stats = importTx();

    return res.json({
      message: 'Seed import completed.',
      stats,
    });
  } catch (err) {
    console.error('Seed import failed:', err);
    return res.status(500).json({ error: 'Failed to import seed data.' });
  }
});

// Rebuild members from seed (root repair + full sync)
router.post('/root-repair-sync', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const payload = await loadSeedPayload();

    if (!payload || !payload.family_tree) {
      return res.status(400).json({ error: 'No valid family_lineage.json payload found locally or on Google Drive.' });
    }

    const db = getDb();
    const beforeCount = db.prepare('SELECT COUNT(*) as cnt FROM members').get().cnt;

    const runSync = db.transaction(() => {
      db.exec('DELETE FROM member_extra; DELETE FROM members;');
      const importStats = importFamilyData(db, payload);
      const placeholderCleanup = cleanupDuplicatePlaceholders(db);
      const afterCount = db.prepare('SELECT COUNT(*) as cnt FROM members').get().cnt;
      const rootCount = db.prepare('SELECT COUNT(*) as cnt FROM members WHERE parent_id IS NULL').get().cnt;

      return {
        beforeCount,
        afterCount,
        rootCount,
        importStats,
        placeholderCleanup,
      };
    });

    const result = runSync();
    return res.json({
      message: 'Root repair full sync completed.',
      result,
    });
  } catch (err) {
    console.error('Root repair full sync failed:', err);
    return res.status(500).json({ error: 'Failed to complete root repair full sync.' });
  }
});

// Cleanup duplicate unnamed placeholder members created by older imports
router.post('/cleanup-placeholders', authenticateToken, requireAdmin, (_req, res) => {
  try {
    const db = getDb();
    const result = cleanupDuplicatePlaceholders(db);

    return res.json({
      message: 'Placeholder cleanup completed.',
      result,
    });
  } catch (err) {
    console.error('Placeholder cleanup failed:', err);
    return res.status(500).json({ error: 'Failed to cleanup placeholder duplicates.' });
  }
});

// Backup current DB state to Google Drive
router.post('/backup-drive', authenticateToken, requireAdmin, async (_req, res) => {
  if (!isGdriveConfigured()) {
    return res.status(400).json({ error: 'Google Drive not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_DRIVE_FOLDER_ID environment variables.' });
  }
  try {
    const seedData = exportTreeAsSeedJson();
    const result = await uploadBackup(JSON.stringify(seedData, null, 4));
    res.json({ message: `Backup ${result.action} on Google Drive`, fileId: result.fileId, modifiedTime: result.modifiedTime });
  } catch (err) {
    console.error('Google Drive backup failed:', err);
    res.status(500).json({ error: 'Google Drive backup failed: ' + err.message });
  }
});

router.get('/subtree/:id', (req, res) => {
  const tree = buildNestedTree(req.params.id);
  if (!tree) {
    return res.status(404).json({ error: 'Member not found' });
  }
  res.json(tree);
});

router.get('/ancestor-path/:id', (req, res) => {
  const pathResult = getAncestorPath(req.params.id);
  if (!pathResult || pathResult.length === 0) {
    return res.status(404).json({ error: 'Member not found' });
  }
  res.json(pathResult);
});

export default router;
