import { getDb } from '../config/db.js';

function choosePrimaryRoot(roots, childrenMap) {
  const memo = new Map();

  function subtreeSize(id) {
    if (memo.has(id)) return memo.get(id);
    const childIds = childrenMap.get(id) || [];
    let total = 1;
    for (const cid of childIds) {
      total += subtreeSize(cid);
    }
    memo.set(id, total);
    return total;
  }

  const sorted = [...roots].sort((a, b) => {
    const sizeA = subtreeSize(a.id);
    const sizeB = subtreeSize(b.id);
    if (sizeA !== sizeB) return sizeB - sizeA;

    const genA = Number.isInteger(a.generation_level) ? a.generation_level : 0;
    const genB = Number.isInteger(b.generation_level) ? b.generation_level : 0;
    if (genA !== genB) return genA - genB;

    const createdA = a.created_at || '';
    const createdB = b.created_at || '';
    return createdA.localeCompare(createdB);
  });

  return sorted[0] || null;
}

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
  if (roots.length === 0) {
    return null;
  }

  if (roots.length === 1) {
    return buildSubtree(roots[0].id);
  }

  // Prefer the largest connected lineage when legacy duplicate roots exist.
  const primaryRoot = choosePrimaryRoot(roots, childrenMap);
  return primaryRoot ? buildSubtree(primaryRoot.id) : null;
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

/**
 * Export tree in the same schema as family_lineage.json (seed-compatible format).
 * This ensures the seed file and export stay in sync.
 */
export function exportTreeAsSeedJson() {
  const db = getDb();
  const allMembers = db.prepare('SELECT * FROM members ORDER BY generation_level').all();

  const childrenMap = new Map();
  const memberMap = new Map();

  for (const m of allMembers) {
    memberMap.set(m.id, m);
    if (!childrenMap.has(m.parent_id)) {
      childrenMap.set(m.parent_id, []);
    }
    childrenMap.get(m.parent_id).push(m.id);
  }

  function buildSeedNode(id) {
    const m = memberMap.get(id);
    if (!m) return null;

    const node = {
      name_np: m.name_np || '',
      name_en: m.name_en || '',
    };

    if (m.spouse_np) node.spouse_np = m.spouse_np;
    if (m.spouse_en) node.spouse_en = m.spouse_en;
    if (m.relationship) node.relationship = m.relationship;
    if (m.notes) node.notes = m.notes;

    // Parse siblings back from JSON string
    if (m.siblings) {
      try {
        const parsed = JSON.parse(m.siblings);
        if (Array.isArray(parsed) && parsed.length > 0) {
          node.siblings = parsed;
        }
      } catch { /* not valid JSON, skip */ }
    }

    const childIds = childrenMap.get(id) || [];
    if (childIds.length > 0) {
      node.children = childIds.map(cid => buildSeedNode(cid)).filter(Boolean);
    }

    return node;
  }

  const roots = allMembers.filter(m => !m.parent_id);
  if (roots.length === 0) {
    return { family_tree: null };
  }

  if (roots.length === 1) {
    return { family_tree: buildSeedNode(roots[0].id) };
  }

  const primaryRoot = choosePrimaryRoot(roots, childrenMap);
  return { family_tree: primaryRoot ? buildSeedNode(primaryRoot.id) : null };
}
