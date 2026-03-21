export const genderColors = {
  male: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', accent: '#3b82f6' },
  female: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d', accent: '#ec4899' },
};

export const genderColorsDark = {
  male: { bg: '#1e3a5f', border: '#60a5fa', text: '#93c5fd', accent: '#60a5fa' },
  female: { bg: '#4a1942', border: '#f472b6', text: '#f9a8d4', accent: '#f472b6' },
};

const branchPalette = [
  { bg: '#eff6ff', border: '#3b82f6', label: '#1d4ed8' },
  { bg: '#f0fdf4', border: '#22c55e', label: '#15803d' },
  { bg: '#fefce8', border: '#eab308', label: '#a16207' },
  { bg: '#fdf2f8', border: '#ec4899', label: '#be185d' },
  { bg: '#f5f3ff', border: '#8b5cf6', label: '#6d28d9' },
  { bg: '#fff7ed', border: '#f97316', label: '#c2410c' },
  { bg: '#ecfeff', border: '#06b6d4', label: '#0e7490' },
  { bg: '#fef2f2', border: '#ef4444', label: '#b91c1c' },
];

const branchColorMap = new Map();

export function getBranchColor(branchRoot) {
  if (!branchRoot) return branchPalette[0];
  if (!branchColorMap.has(branchRoot)) {
    branchColorMap.set(branchRoot, branchPalette[branchColorMap.size % branchPalette.length]);
  }
  return branchColorMap.get(branchRoot);
}

export const generationColors = [
  '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6',
  '#60a5fa', '#93c5fd', '#bfdbfe',
];

export function getGenerationColor(level) {
  return generationColors[level % generationColors.length];
}
