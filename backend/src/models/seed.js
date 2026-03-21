import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getDb, closeDb } from '../config/db.js';
import { initializeSchema } from './schema.js';
import { generateMemberId, generateUserId } from '../utils/idGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const JSON_PATH = path.join(__dirname, '..', '..', '..', 'family_lineage.json');

function determineBranchRoot(node, parentBranchRoot, generationLevel) {
  // Children of Chhabilal (generation 2) become branch roots
  if (generationLevel === 3) {
    return node.name_en || '';
  }
  return parentBranchRoot;
}

function deriveGender(node) {
  if (node.relationship === 'daughter') return 'female';
  if (node.relationship === 'son') return 'male';
  // For root nodes without explicit relationship, infer from name patterns
  return 'male';
}

function processNode(db, node, parentId, generationLevel, branchRoot) {
  const id = generateMemberId();
  const gender = deriveGender(node);
  const currentBranch = determineBranchRoot(node, branchRoot, generationLevel);

  const insertMember = db.prepare(`
    INSERT INTO members (id, name_np, name_en, spouse_np, spouse_en, parent_id, relationship, gender, generation_level, family_branch_root, notes, siblings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMember.run(
    id,
    node.name_np || '',
    node.name_en || '',
    node.spouse_np || '',
    node.spouse_en || '',
    parentId,
    node.relationship || (parentId ? 'son' : ''),
    gender,
    generationLevel,
    currentBranch || branchRoot,
    node.notes || '',
    Array.isArray(node.siblings) ? JSON.stringify(node.siblings) : ''
  );

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      processNode(db, child, id, generationLevel + 1, currentBranch || branchRoot);
    }
  }

  return id;
}

async function seed() {
  console.log('Initializing database schema...');
  const db = initializeSchema();

  // Check if already seeded
  const count = db.prepare('SELECT COUNT(*) as cnt FROM members').get();
  if (count.cnt > 0) {
    console.log(`Database already has ${count.cnt} members. Dropping and re-seeding...`);
    db.exec('DELETE FROM member_extra; DELETE FROM members; DELETE FROM users;');
  }

  // Seed admin user
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(adminPassword, 12);

  db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)').run(
    generateUserId(),
    adminUsername,
    hash,
    'admin'
  );
  console.log(`Admin user created: ${adminUsername}`);

  // Read and parse family data
  console.log('Reading family_lineage.json...');
  const raw = fs.readFileSync(JSON_PATH, 'utf-8');
  const data = JSON.parse(raw);
  const root = data.family_tree;

  // Process tree in a transaction for performance
  console.log('Seeding family members...');
  const seedAll = db.transaction(() => {
    processNode(db, root, null, 0, '');
  });
  seedAll();

  const finalCount = db.prepare('SELECT COUNT(*) as cnt FROM members').get();
  const genCount = db.prepare('SELECT MAX(generation_level) as maxGen FROM members').get();
  console.log(`Seeded ${finalCount.cnt} members across ${genCount.maxGen + 1} generations.`);

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
