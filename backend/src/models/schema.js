import { getDb } from '../config/db.js';

export function initializeSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name_np TEXT NOT NULL DEFAULT '',
      name_en TEXT NOT NULL DEFAULT '',
      spouse_np TEXT DEFAULT '',
      spouse_en TEXT DEFAULT '',
      parent_id TEXT,
      relationship TEXT DEFAULT 'son',
      gender TEXT DEFAULT 'male',
      generation_level INTEGER DEFAULT 0,
      family_branch_root TEXT DEFAULT '',
      image_path TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      siblings TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES members(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS member_extra (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id TEXT NOT NULL,
      field_key TEXT NOT NULL,
      field_value TEXT DEFAULT '',
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      UNIQUE(member_id, field_key)
    );

    CREATE INDEX IF NOT EXISTS idx_members_parent ON members(parent_id);
    CREATE INDEX IF NOT EXISTS idx_members_name_en ON members(name_en);
    CREATE INDEX IF NOT EXISTS idx_members_name_np ON members(name_np);
    CREATE INDEX IF NOT EXISTS idx_members_branch ON members(family_branch_root);
    CREATE INDEX IF NOT EXISTS idx_members_generation ON members(generation_level);
    CREATE INDEX IF NOT EXISTS idx_member_extra_member ON member_extra(member_id);
  `);

  return db;
}
