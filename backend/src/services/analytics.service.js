import { getDb } from '../config/db.js';

export function getOverview() {
  const db = getDb();

  const total = db.prepare('SELECT COUNT(*) as count FROM members').get().count;
  const maxGen = db.prepare('SELECT MAX(generation_level) as maxGen FROM members').get().maxGen;
  const genderCounts = db.prepare('SELECT gender, COUNT(*) as count FROM members GROUP BY gender').all();

  const maleCount = genderCounts.find(g => g.gender === 'male')?.count || 0;
  const femaleCount = genderCounts.find(g => g.gender === 'female')?.count || 0;

  const parentsWithChildren = db.prepare(`
    SELECT parent_id, COUNT(*) as cnt FROM members 
    WHERE parent_id IS NOT NULL 
    GROUP BY parent_id
  `).all();
  const avgChildren = parentsWithChildren.length > 0
    ? (parentsWithChildren.reduce((s, p) => s + p.cnt, 0) / parentsWithChildren.length).toFixed(2)
    : 0;

  const missingNameNp = db.prepare("SELECT COUNT(*) as c FROM members WHERE name_np = '' OR name_np IS NULL").get().c;
  const missingNameEn = db.prepare("SELECT COUNT(*) as c FROM members WHERE name_en = '' OR name_en IS NULL").get().c;
  const missingSpouse = db.prepare(`
    SELECT COUNT(*) as c FROM members 
    WHERE gender = 'male' AND generation_level > 0 
    AND (spouse_en = '' OR spouse_en IS NULL) AND (spouse_np = '' OR spouse_np IS NULL)
  `).get().c;

  return {
    total_members: total,
    total_generations: (maxGen || 0) + 1,
    male_count: maleCount,
    female_count: femaleCount,
    gender_ratio: femaleCount > 0 ? (maleCount / femaleCount).toFixed(2) : 'N/A',
    avg_children_per_family: parseFloat(avgChildren),
    missing_data: {
      missing_name_np: missingNameNp,
      missing_name_en: missingNameEn,
      missing_spouse: missingSpouse,
      total_missing: missingNameNp + missingNameEn + missingSpouse,
    },
  };
}

export function getBranchAnalytics() {
  const db = getDb();

  const branches = db.prepare(`
    SELECT family_branch_root as branch, 
           COUNT(*) as total_descendants,
           MAX(generation_level) as max_depth,
           MIN(generation_level) as min_depth
    FROM members 
    WHERE family_branch_root != '' 
    GROUP BY family_branch_root 
    ORDER BY total_descendants DESC
  `).all();

  const branchDetails = branches.map(b => {
    const leafCount = db.prepare(`
      SELECT COUNT(*) as c FROM members m 
      WHERE m.family_branch_root = ? 
      AND NOT EXISTS (SELECT 1 FROM members c WHERE c.parent_id = m.id)
    `).get(b.branch).c;

    const genderDist = db.prepare(`
      SELECT gender, COUNT(*) as count FROM members 
      WHERE family_branch_root = ? GROUP BY gender
    `).all(b.branch);

    return {
      ...b,
      depth_span: b.max_depth - b.min_depth + 1,
      leaf_count: leafCount,
      gender_distribution: Object.fromEntries(genderDist.map(g => [g.gender, g.count])),
    };
  });

  return branchDetails;
}

export function getGenerationAnalytics() {
  const db = getDb();

  const generations = db.prepare(`
    SELECT generation_level, gender, COUNT(*) as count 
    FROM members 
    GROUP BY generation_level, gender 
    ORDER BY generation_level
  `).all();

  const genMap = new Map();
  for (const row of generations) {
    if (!genMap.has(row.generation_level)) {
      genMap.set(row.generation_level, { generation: row.generation_level, male: 0, female: 0, total: 0 });
    }
    const entry = genMap.get(row.generation_level);
    entry[row.gender] = row.count;
    entry.total += row.count;
  }

  const genArray = Array.from(genMap.values());

  // Avg children per generation (parents in that generation)
  for (const gen of genArray) {
    const parents = db.prepare(`
      SELECT m.id, COUNT(c.id) as child_count 
      FROM members m 
      LEFT JOIN members c ON c.parent_id = m.id 
      WHERE m.generation_level = ? 
      GROUP BY m.id 
      HAVING child_count > 0
    `).all(gen.generation);

    gen.avg_children = parents.length > 0
      ? parseFloat((parents.reduce((s, p) => s + p.child_count, 0) / parents.length).toFixed(2))
      : 0;
  }

  return genArray;
}

export function getMissingData() {
  const db = getDb();

  const missingNameNp = db.prepare(`
    SELECT id, name_en, generation_level, family_branch_root 
    FROM members WHERE name_np = '' OR name_np IS NULL
  `).all();

  const missingNameEn = db.prepare(`
    SELECT id, name_np, generation_level, family_branch_root 
    FROM members WHERE name_en = '' OR name_en IS NULL
  `).all();

  const missingSpouse = db.prepare(`
    SELECT id, name_np, name_en, generation_level, family_branch_root 
    FROM members 
    WHERE (spouse_en = '' OR spouse_en IS NULL) AND (spouse_np = '' OR spouse_np IS NULL)
    AND generation_level > 0
  `).all();

  const noChildren = db.prepare(`
    SELECT m.id, m.name_np, m.name_en, m.generation_level, m.family_branch_root 
    FROM members m 
    WHERE NOT EXISTS (SELECT 1 FROM members c WHERE c.parent_id = m.id)
    AND m.gender = 'male'
    AND m.generation_level < (SELECT MAX(generation_level) FROM members) - 1
  `).all();

  return {
    missing_name_np: missingNameNp,
    missing_name_en: missingNameEn,
    missing_spouse: missingSpouse,
    no_children_recorded: noChildren,
  };
}
