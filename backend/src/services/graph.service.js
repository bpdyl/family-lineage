import { getDb } from '../config/db.js';

function buildAdjacencyList() {
  const db = getDb();
  const members = db.prepare('SELECT id, parent_id, name_np, name_en, gender, generation_level, family_branch_root FROM members').all();

  const adj = new Map();
  const nodeMap = new Map();

  for (const m of members) {
    nodeMap.set(m.id, m);
    if (!adj.has(m.id)) adj.set(m.id, []);
  }

  for (const m of members) {
    if (m.parent_id) {
      adj.get(m.id).push(m.parent_id);
      if (!adj.has(m.parent_id)) adj.set(m.parent_id, []);
      adj.get(m.parent_id).push(m.id);
    }
  }

  return { adj, nodeMap };
}

export function findPath(fromId, toId) {
  const { adj, nodeMap } = buildAdjacencyList();

  if (!nodeMap.has(fromId) || !nodeMap.has(toId)) {
    return null;
  }

  if (fromId === toId) {
    return [nodeMap.get(fromId)];
  }

  // BFS
  const visited = new Set();
  const parent = new Map();
  const queue = [fromId];
  visited.add(fromId);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === toId) {
      const path = [];
      let node = toId;
      while (node !== undefined) {
        path.unshift(nodeMap.get(node));
        node = parent.get(node);
      }
      return path;
    }

    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }

  return null;
}

function getAncestors(nodeId) {
  const db = getDb();
  const ancestors = [];
  let current = db.prepare('SELECT id, parent_id FROM members WHERE id = ?').get(nodeId);

  while (current) {
    ancestors.push(current.id);
    if (!current.parent_id) break;
    current = db.prepare('SELECT id, parent_id FROM members WHERE id = ?').get(current.parent_id);
  }

  return ancestors;
}

export function findLCA(idA, idB) {
  const ancestorsA = getAncestors(idA);
  const ancestorsB = new Set(getAncestors(idB));

  for (const anc of ancestorsA) {
    if (ancestorsB.has(anc)) {
      return anc;
    }
  }

  return null;
}

function generationDistance(fromId, toId) {
  const db = getDb();
  const from = db.prepare('SELECT generation_level FROM members WHERE id = ?').get(fromId);
  const to = db.prepare('SELECT generation_level FROM members WHERE id = ?').get(toId);
  if (!from || !to) return null;
  return Math.abs(from.generation_level - to.generation_level);
}

export function resolveRelationship(idA, idB) {
  const db = getDb();
  const memberA = db.prepare('SELECT * FROM members WHERE id = ?').get(idA);
  const memberB = db.prepare('SELECT * FROM members WHERE id = ?').get(idB);

  if (!memberA || !memberB) return null;

  if (idA === idB) {
    return { relationship_en: 'Self', relationship_np: 'आफू', lca_id: idA };
  }

  const lcaId = findLCA(idA, idB);
  if (!lcaId) return { relationship_en: 'No relation found', relationship_np: 'सम्बन्ध भेटिएन', lca_id: null };

  const lca = db.prepare('SELECT * FROM members WHERE id = ?').get(lcaId);
  const distA = memberA.generation_level - lca.generation_level;
  const distB = memberB.generation_level - lca.generation_level;

  const rel = computeRelationshipLabel(distA, distB, memberA, memberB, lca, idA, idB);

  return {
    ...rel,
    lca_id: lcaId,
    lca_name_en: lca.name_en,
    lca_name_np: lca.name_np,
    generation_distance_a: distA,
    generation_distance_b: distB,
  };
}

function computeRelationshipLabel(distA, distB, personA, personB, lca, idA, idB) {
  const genderB = personB.gender;

  // Direct parent-child
  if (distA === 0 && distB === 1) {
    return genderB === 'male'
      ? { relationship_en: 'Son', relationship_np: 'छोरा' }
      : { relationship_en: 'Daughter', relationship_np: 'छोरी' };
  }
  if (distA === 1 && distB === 0) {
    return genderB === 'male'
      ? { relationship_en: 'Father', relationship_np: 'बुबा' }
      : { relationship_en: 'Mother', relationship_np: 'आमा' };
  }

  // Siblings (same parent, same generation)
  if (distA === 1 && distB === 1) {
    return genderB === 'male'
      ? { relationship_en: 'Brother', relationship_np: 'दाजु/भाइ' }
      : { relationship_en: 'Sister', relationship_np: 'दिदी/बहिनी' };
  }

  // Grandparent / Grandchild
  if (distA === 0 && distB === 2) {
    return genderB === 'male'
      ? { relationship_en: 'Grandson', relationship_np: 'नाति' }
      : { relationship_en: 'Granddaughter', relationship_np: 'नातिनी' };
  }
  if (distA === 2 && distB === 0) {
    return genderB === 'male'
      ? { relationship_en: 'Grandfather', relationship_np: 'हजुरबुबा' }
      : { relationship_en: 'Grandmother', relationship_np: 'हजुरआमा' };
  }

  // Great-grandparent / Great-grandchild
  if (distA === 0 && distB === 3) {
    return genderB === 'male'
      ? { relationship_en: 'Great-grandson', relationship_np: 'पनाति' }
      : { relationship_en: 'Great-granddaughter', relationship_np: 'पनातिनी' };
  }
  if (distA === 3 && distB === 0) {
    return genderB === 'male'
      ? { relationship_en: 'Great-grandfather', relationship_np: 'पुर्खा हजुरबुबा' }
      : { relationship_en: 'Great-grandmother', relationship_np: 'पुर्खा हजुरआमा' };
  }

  // Uncle/Aunt (parent's sibling)
  if (distA === 2 && distB === 1) {
    return genderB === 'male'
      ? { relationship_en: 'Uncle (Kaka/Thulba)', relationship_np: 'काका/ठूलबा' }
      : { relationship_en: 'Aunt (Kaki/Thulama)', relationship_np: 'काकी/ठूलआमा' };
  }

  // Nephew/Niece (sibling's child)
  if (distA === 1 && distB === 2) {
    return genderB === 'male'
      ? { relationship_en: 'Nephew (Bhatija)', relationship_np: 'भतिजा' }
      : { relationship_en: 'Niece (Bhatiji)', relationship_np: 'भतिजी' };
  }

  // Cousins
  if (distA === distB && distA >= 2) {
    const cousinDegree = distA - 1;
    if (cousinDegree === 1) {
      return { relationship_en: 'First Cousin', relationship_np: 'पहिलो कजिन' };
    }
    return { relationship_en: `${ordinal(cousinDegree)} Cousin`, relationship_np: `${cousinDegree} औं कजिन` };
  }

  // Cousin removed
  if (distA >= 2 && distB >= 2 && distA !== distB) {
    const minDist = Math.min(distA, distB);
    const cousinDegree = minDist - 1;
    const removed = Math.abs(distA - distB);
    return {
      relationship_en: `${ordinal(cousinDegree)} Cousin ${removed}x removed`,
      relationship_np: `${cousinDegree} औं कजिन (${removed} पुस्ता फरक)`,
    };
  }

  // Generic ancestor/descendant
  if (distA === 0 && distB > 0) {
    return { relationship_en: `${distB}th-gen Descendant`, relationship_np: `${distB} पुस्ता सन्तान` };
  }
  if (distB === 0 && distA > 0) {
    return { relationship_en: `${distA}th-gen Ancestor`, relationship_np: `${distA} पुस्ता पुर्खा` };
  }

  // Grand-uncle/aunt
  if (distA === 3 && distB === 1) {
    return genderB === 'male'
      ? { relationship_en: 'Grand-uncle', relationship_np: 'ठूलबा/ठूलकाका' }
      : { relationship_en: 'Grand-aunt', relationship_np: 'ठूलआमा/ठूलकाकी' };
  }

  return {
    relationship_en: `Related (${distA} up, ${distB} down from common ancestor)`,
    relationship_np: `सम्बन्धित (साझा पुर्खाबाट ${distA} माथि, ${distB} तल)`,
  };
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
