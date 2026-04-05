import { generateMemberId } from '../utils/idGenerator.js';

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeNameNode(node) {
  return normalizeText(node?.name_en) || normalizeText(node?.name_np);
}

function cloneNode(node) {
  if (!node || typeof node !== 'object') return {};
  const copy = { ...node };
  if (Array.isArray(node.children)) {
    copy.children = node.children.map(child => cloneNode(child));
  }
  return copy;
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [value];
  return [];
}

function findNodeByName(root, targetName) {
  if (!root || !targetName) return null;
  const target = normalizeText(targetName);

  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;

    if (normalizeNameNode(node) === target) {
      return node;
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        stack.push(child);
      }
    }
  }

  return null;
}

function pushChildUnique(parent, childNode) {
  if (!parent.children) parent.children = [];

  const incomingName = normalizeNameNode(childNode);
  const exists = parent.children.some(existing => {
    const existingName = normalizeNameNode(existing);
    if (!incomingName || !existingName) return false;
    return incomingName === existingName;
  });

  if (!exists) {
    parent.children.push(childNode);
  }
}

function inferAttachTargetName(branch, familyRoot, ancestorChain) {
  if (branch.attach_to_name) return branch.attach_to_name;
  if (branch.attach_to_ancestor) return branch.attach_to_ancestor;

  const relation = normalizeText(branch.relationship_to_root);

  // father_brother: attach to grandparent of the family_tree root
  if (relation === 'father_brother' && ancestorChain.length >= 2) {
    return ancestorChain[ancestorChain.length - 2].name_en || ancestorChain[ancestorChain.length - 2].name_np;
  }

  // paternal_line in the provided source is also parallel to the father branch
  if (relation === 'paternal_line' && ancestorChain.length >= 2) {
    return ancestorChain[ancestorChain.length - 2].name_en || ancestorChain[ancestorChain.length - 2].name_np;
  }

  return familyRoot.name_en || familyRoot.name_np || '';
}

export function normalizeImportPayload(payload) {
  const treeRoots = toArray(payload?.family_tree).map(root => cloneNode(root));
  const extended = payload?.extended_hierarchy || {};
  const ancestors = toArray(extended.ancestor_chain_to_bishnudatta).map(a => cloneNode(a));
  const collateral = toArray(extended.collateral_branches).map(c => cloneNode(c));

  if (treeRoots.length === 0) {
    return [];
  }

  // Wrap the first family root in an ancestor chain if present.
  let primaryRoot = treeRoots[0];
  if (ancestors.length > 0) {
    for (let i = ancestors.length - 1; i >= 0; i -= 1) {
      const ancestor = cloneNode(ancestors[i]);
      if (!Array.isArray(ancestor.children)) ancestor.children = [];
      ancestor.children.push(primaryRoot);
      primaryRoot = ancestor;
    }
  }

  if (collateral.length > 0) {
    for (const branch of collateral) {
      const attachToName = inferAttachTargetName(branch, treeRoots[0], ancestors);
      const target = findNodeByName(primaryRoot, attachToName);
      if (target) {
        pushChildUnique(target, branch);
      } else {
        // If target is not found, keep branch reachable by attaching to top root.
        pushChildUnique(primaryRoot, branch);
      }
    }
  }

  const normalizedRoots = [primaryRoot, ...treeRoots.slice(1)];
  return normalizedRoots;
}

function isChhabilal(node) {
  const en = normalizeText(node?.name_en);
  const np = normalizeText(node?.name_np);

  return en.includes('chhabilal') || np.includes('छविलाल');
}

function determineBranchRoot(node, parentNode, parentBranchRoot) {
  if (isChhabilal(parentNode)) {
    return (node.name_en || node.name_np || '').trim();
  }
  return parentBranchRoot;
}

function deriveGender(relationship) {
  if (relationship === 'daughter') return 'female';
  if (relationship === 'son') return 'male';
  return 'male';
}

function getCandidatesByParent(db, parentId) {
  if (parentId == null) {
    return db.prepare('SELECT * FROM members WHERE parent_id IS NULL').all();
  }
  return db.prepare('SELECT * FROM members WHERE parent_id = ?').all(parentId);
}

function findExistingMember(db, node, parentId) {
  const candidates = getCandidatesByParent(db, parentId);
  const targetEn = normalizeText(node.name_en);
  const targetNp = String(node.name_np || '').trim();

  const directMatch = candidates.find(member => {
    const enMatch = targetEn && normalizeText(member.name_en) === targetEn;
    const npMatch = targetNp && String(member.name_np || '').trim() === targetNp;
    return enMatch || npMatch;
  });

  if (directMatch) {
    return directMatch;
  }

  // Fallback for unnamed placeholders: match by relationship + spouse + notes.
  if (!targetEn && !targetNp) {
    const targetRel = String(node.relationship || (parentId ? 'son' : '')).trim();
    const targetSpouseEn = normalizeText(node.spouse_en);
    const targetSpouseNp = String(node.spouse_np || '').trim();
    const targetNotes = normalizeText(node.notes);

    const unnamedCandidates = candidates.filter(member => {
      const memberEn = normalizeText(member.name_en);
      const memberNp = String(member.name_np || '').trim();
      return !memberEn && !memberNp;
    });

    const fallbackMatch = unnamedCandidates.find(member => {
      const relMatch = String(member.relationship || '').trim() === targetRel;
      const spouseEnMatch = normalizeText(member.spouse_en) === targetSpouseEn;
      const spouseNpMatch = String(member.spouse_np || '').trim() === targetSpouseNp;
      const notesMatch = normalizeText(member.notes) === targetNotes;
      return relMatch && spouseEnMatch && spouseNpMatch && notesMatch;
    });

    if (fallbackMatch) {
      return fallbackMatch;
    }
  }

  return null;
}

function findRootCandidateByName(db, node) {
  const targetEn = normalizeText(node.name_en);
  const targetNp = String(node.name_np || '').trim();
  if (!targetEn && !targetNp) return null;

  const roots = getCandidatesByParent(db, null);
  const matches = roots.filter(member => {
    const enMatch = targetEn && normalizeText(member.name_en) === targetEn;
    const npMatch = targetNp && String(member.name_np || '').trim() === targetNp;
    return enMatch || npMatch;
  });

  if (matches.length === 1) {
    return matches[0];
  }

  return null;
}

function upsertMember(db, node, parentId, generationLevel, branchRoot, stats) {
  let existing = findExistingMember(db, node, parentId);

  // If the node moved under a newly introduced ancestor, reparent a unique matching root.
  if (!existing && parentId !== null) {
    const rootCandidate = findRootCandidateByName(db, node);
    if (rootCandidate) {
      existing = rootCandidate;
    }
  }

  const payload = {
    name_np: node.name_np || '',
    name_en: node.name_en || '',
    spouse_np: node.spouse_np || '',
    spouse_en: node.spouse_en || '',
    relationship: node.relationship || (parentId ? 'son' : ''),
    gender: deriveGender(node.relationship || (parentId ? 'son' : '')),
    generation_level: generationLevel,
    family_branch_root: branchRoot || '',
    notes: node.notes || '',
    siblings: Array.isArray(node.siblings) ? JSON.stringify(node.siblings) : '',
  };

  if (existing) {
    db.prepare(`
      UPDATE members
      SET
        name_np = ?,
        name_en = ?,
        spouse_np = ?,
        spouse_en = ?,
        parent_id = ?,
        relationship = ?,
        gender = ?,
        generation_level = ?,
        family_branch_root = ?,
        notes = ?,
        siblings = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      payload.name_np,
      payload.name_en,
      payload.spouse_np,
      payload.spouse_en,
      parentId,
      payload.relationship,
      payload.gender,
      payload.generation_level,
      payload.family_branch_root,
      payload.notes,
      payload.siblings,
      existing.id
    );

    stats.updated += 1;
    return existing.id;
  }

  const id = generateMemberId();
  db.prepare(`
    INSERT INTO members (
      id, name_np, name_en, spouse_np, spouse_en, parent_id,
      relationship, gender, generation_level, family_branch_root, notes, siblings
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    payload.name_np,
    payload.name_en,
    payload.spouse_np,
    payload.spouse_en,
    parentId,
    payload.relationship,
    payload.gender,
    payload.generation_level,
    payload.family_branch_root,
    payload.notes,
    payload.siblings
  );

  stats.inserted += 1;
  return id;
}

function processNode(db, node, parentId, generationLevel, branchRoot, parentNode, stats) {
  const currentBranch = determineBranchRoot(node, parentNode, branchRoot);
  const id = upsertMember(db, node, parentId, generationLevel, currentBranch, stats);

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      processNode(db, child, id, generationLevel + 1, currentBranch, node, stats);
    }
  }
}

export function importFamilyData(db, payload) {
  const roots = normalizeImportPayload(payload);
  if (roots.length === 0) {
    throw new Error('No importable roots found. Provide family_tree in payload.');
  }

  const stats = { inserted: 0, updated: 0, rootCount: roots.length };

  for (const root of roots) {
    processNode(db, root, null, 0, '', null, stats);
  }

  stats.totalTouched = stats.inserted + stats.updated;
  return stats;
}

export function cleanupDuplicatePlaceholders(db) {
  const groups = db.prepare(`
    SELECT
      parent_id,
      relationship,
      COALESCE(spouse_np, '') AS spouse_np,
      COALESCE(spouse_en, '') AS spouse_en,
      COALESCE(notes, '') AS notes,
      COUNT(*) AS cnt
    FROM members
    WHERE TRIM(COALESCE(name_en, '')) = ''
      AND TRIM(COALESCE(name_np, '')) = ''
    GROUP BY parent_id, relationship, COALESCE(spouse_np, ''), COALESCE(spouse_en, ''), COALESCE(notes, '')
    HAVING COUNT(*) > 1
  `).all();

  const selectIds = db.prepare(`
    SELECT id, created_at
    FROM members
    WHERE
      parent_id IS ?
      AND relationship = ?
      AND COALESCE(spouse_np, '') = ?
      AND COALESCE(spouse_en, '') = ?
      AND COALESCE(notes, '') = ?
      AND TRIM(COALESCE(name_en, '')) = ''
      AND TRIM(COALESCE(name_np, '')) = ''
    ORDER BY datetime(created_at) ASC, id ASC
  `);

  const moveChildren = db.prepare('UPDATE members SET parent_id = ? WHERE parent_id = ?');
  const moveExtras = db.prepare(`
    INSERT INTO member_extra (member_id, field_key, field_value)
    SELECT ?, field_key, field_value
    FROM member_extra
    WHERE member_id = ?
    ON CONFLICT(member_id, field_key) DO UPDATE SET field_value = excluded.field_value
  `);
  const deleteMember = db.prepare('DELETE FROM members WHERE id = ?');

  const runCleanup = db.transaction(() => {
    let removed = 0;
    const details = [];

    for (const group of groups) {
      const ids = selectIds.all(
        group.parent_id,
        group.relationship,
        group.spouse_np,
        group.spouse_en,
        group.notes
      );

      if (ids.length <= 1) continue;

      const keeper = ids[0].id;
      const duplicates = ids.slice(1).map(row => row.id);

      for (const duplicateId of duplicates) {
        moveChildren.run(keeper, duplicateId);
        moveExtras.run(keeper, duplicateId);
        deleteMember.run(duplicateId);
        removed += 1;
      }

      details.push({
        keeper,
        removed: duplicates,
      });
    }

    return {
      removed,
      groupsScanned: groups.length,
      groupsCleaned: details.length,
      details,
    };
  });

  return runCleanup();
}
