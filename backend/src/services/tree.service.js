import { getDb } from '../config/db.js';

export function getAllMembersFlat() {
  const db = getDb();
  return db.prepare('SELECT * FROM members ORDER BY generation_level, name_en').all();
}

export function getMemberById(id) {
  const db = getDb();
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  if (!member) return null;

  const extras = db.prepare('SELECT field_key, field_value FROM member_extra WHERE member_id = ?').all(id);
  member.extras = {};
  for (const e of extras) {
    member.extras[e.field_key] = e.field_value;
  }
  return member;
}

export function buildNestedTree(rootId = null) {
  const db = getDb();
  const allMembers = db.prepare('SELECT * FROM members ORDER BY generation_level').all();

  const childrenMap = new Map();
  const memberMap = new Map();

  for (const m of allMembers) {
    memberMap.set(m.id, { ...m, children: [] });
    if (!childrenMap.has(m.parent_id)) {
      childrenMap.set(m.parent_id, []);
    }
    childrenMap.get(m.parent_id).push(m.id);
  }

  function buildSubtree(id) {
    const node = memberMap.get(id);
    if (!node) return null;

    const childIds = childrenMap.get(id) || [];
    node.children = childIds.map(cid => buildSubtree(cid)).filter(Boolean);
    node.num_children = node.children.length;
    node.is_leaf = node.children.length === 0;
    node.has_spouse = !!(node.spouse_en || node.spouse_np);
    return node;
  }

  if (rootId) {
    return buildSubtree(rootId);
  }

  // Find root(s) -- members with no parent
  const roots = allMembers.filter(m => !m.parent_id);
  if (roots.length === 1) {
    return buildSubtree(roots[0].id);
  }
  return roots.map(r => buildSubtree(r.id));
}

export function searchMembers(query) {
  const db = getDb();
  const q = `%${query}%`;
  return db.prepare(`
    SELECT id, name_np, name_en, spouse_np, spouse_en, gender, generation_level, family_branch_root, parent_id
    FROM members
    WHERE name_np LIKE ? OR name_en LIKE ? OR spouse_np LIKE ? OR spouse_en LIKE ?
    ORDER BY generation_level, name_en
    LIMIT 50
  `).all(q, q, q, q);
}

export function getAncestorPath(memberId) {
  const db = getDb();
  const path = [];
  let current = db.prepare('SELECT id, name_np, name_en, parent_id FROM members WHERE id = ?').get(memberId);

  while (current) {
    path.unshift(current);
    if (!current.parent_id) break;
    current = db.prepare('SELECT id, name_np, name_en, parent_id FROM members WHERE id = ?').get(current.parent_id);
  }

  return path;
}

export function exportTreeAsJson() {
  return buildNestedTree();
}
