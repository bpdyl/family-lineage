import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeSchema } from './schema.js';
import { closeDb } from '../config/db.js';
import { downloadBackup, isGdriveConfigured } from '../services/gdrive.service.js';
import { importFamilyData, cleanupDuplicatePlaceholders } from '../services/import.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
const JSON_PATH = path.join(__dirname, '..', '..', '..', 'family_lineage.json');

async function loadSeedPayload() {
  if (fs.existsSync(JSON_PATH)) {
    const raw = fs.readFileSync(JSON_PATH, 'utf-8');
    return JSON.parse(raw);
  }

  if (isGdriveConfigured()) {
    return await downloadBackup();
  }

  return null;
}

async function run() {
  console.log('Initializing database schema...');
  const db = initializeSchema();

  const payload = await loadSeedPayload();
  if (!payload || !payload.family_tree) {
    throw new Error('No valid family_lineage.json payload found locally or on Google Drive.');
  }

  const beforeCount = db.prepare('SELECT COUNT(*) as cnt FROM members').get().cnt;

  const execute = db.transaction(() => {
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

  const result = execute();
  console.log('Root repair full sync completed.');
  console.log(JSON.stringify(result, null, 2));

  closeDb();
}

run().catch(err => {
  console.error('Root repair full sync failed:', err);
  closeDb();
  process.exit(1);
});
