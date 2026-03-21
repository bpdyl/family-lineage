import * as d3 from 'd3';

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 100;
export const NODE_H_SPACING = 30;
export const NODE_V_SPACING = 60;

export function computeTreeLayout(data, expandedNodes) {
  if (!data) return { nodes: [], links: [] };

  function filterExpanded(node) {
    const filtered = { ...node };
    if (node.children && node.children.length > 0 && expandedNodes.has(node.id)) {
      filtered.children = node.children.map(c => filterExpanded(c));
    } else {
      filtered.children = null;
      filtered._childCount = node.children?.length || 0;
    }
    return filtered;
  }

  const filteredData = filterExpanded(data);
  const root = d3.hierarchy(filteredData);

  const treeLayout = d3.tree()
    .nodeSize([NODE_WIDTH + NODE_H_SPACING, NODE_HEIGHT + NODE_V_SPACING])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));

  treeLayout(root);

  const nodes = [];
  const links = [];

  root.each(node => {
    nodes.push({
      id: node.data.id,
      x: node.x,
      y: node.y,
      data: node.data,
      depth: node.depth,
      hasChildren: (node.data.children && node.data.children.length > 0) || node.data._childCount > 0,
      isExpanded: expandedNodes.has(node.data.id),
      childCount: node.data.children?.length || node.data._childCount || 0,
    });
  });

  root.links().forEach(link => {
    links.push({
      source: { x: link.source.x, y: link.source.y, id: link.source.data.id },
      target: { x: link.target.x, y: link.target.y, id: link.target.data.id },
    });
  });

  return { nodes, links };
}

export function generateLinkPath(source, target) {
  const sy = source.y + NODE_HEIGHT;
  const ty = target.y;
  const midY = (sy + ty) / 2;

  return `M ${source.x} ${sy} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${ty}`;
}
