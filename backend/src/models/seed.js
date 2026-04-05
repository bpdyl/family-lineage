import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { closeDb } from '../config/db.js';
import { initializeSchema } from './schema.js';
import { generateUserId } from '../utils/idGenerator.js';
import { downloadBackup, isGdriveConfigured } from '../services/gdrive.service.js';
import { importFamilyData } from '../services/import.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const JSON_PATH = path.join(__dirname, '..', '..', '..', 'family_lineage.json');

async function ensureAdminUser(db) {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);
  if (existingAdmin) {
    console.log(`Admin user already exists: ${adminUsername}`);
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 12);
  db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)').run(
    generateUserId(),
    adminUsername,
    hash,
    'admin'
  );
  console.log(`Admin user created: ${adminUsername}`);
}

async function readSeedData() {
  if (fs.existsSync(JSON_PATH)) {
    console.log('Reading family_lineage.json from local file...');
    const raw = fs.readFileSync(JSON_PATH, 'utf-8');
    return JSON.parse(raw);
  }

  if (isGdriveConfigured()) {
    console.log('Local family_lineage.json not found. Fetching from Google Drive...');
    const data = await downloadBackup();
    if (data) {
      fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 4), 'utf-8');
      console.log('Downloaded and saved family_lineage.json from Google Drive.');
      return data;
    }
  }

  return null;
}

async function seed() {
  console.log('Initializing database schema...');
  const db = initializeSchema();

  await ensureAdminUser(db);

  const data = await readSeedData();

  if (!data || !data.family_tree) {
    console.error('No family data found locally or on Google Drive. Seed aborted.');
    closeDb();
    process.exit(1);
  }

  console.log('Importing family members (idempotent merge)...');
  const runImport = db.transaction(() => importFamilyData(db, data));
  const stats = runImport();

  const finalCount = db.prepare('SELECT COUNT(*) as cnt FROM members').get();
  const genCount = db.prepare('SELECT MAX(generation_level) as maxGen FROM members').get();
  const generations = Number.isInteger(genCount.maxGen) ? genCount.maxGen + 1 : 0;
  console.log(`Import complete. Inserted: ${stats.inserted}, Updated: ${stats.updated}, Roots: ${stats.rootCount}`);
  console.log(`Database now has ${finalCount.cnt} members across ${generations} generations.`);

  // Print branch summary
  const branches = db.prepare(`
    SELECT family_branch_root, COUNT(*) as cnt 
    FROM members 
    WHERE family_branch_root != '' 
    GROUP BY family_branch_root 
    ORDER BY cnt DESC
  `).all();
  console.log('\nBranch summary:');
  for (const b of branches) {
    console.log(`  ${b.family_branch_root}: ${b.cnt} members`);
  }

  closeDb();
  console.log('\nSeed complete.');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  closeDb();
  process.exit(1);
});
