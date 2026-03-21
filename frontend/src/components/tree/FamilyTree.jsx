import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import useTreeStore from '../../store/treeStore';
import { computeTreeLayout, generateLinkPath, NODE_HEIGHT } from '../../utils/treeLayout';
import TreeNode from './TreeNode';
import TreeControls from './TreeControls';
import api from '../../services/api';

export default function FamilyTree({ onNodeSelect }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const contentRef = useRef(null);
  const zoomRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDark, setIsDark] = useState(false);

  const {
    treeData, selectedNode, highlightedPath, expandedNodes,
    toggleExpanded, expandAll, collapseAll, selectNode,
  } = useTreeStore();

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDark(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  const { nodes, links } = useMemo(
    () => computeTreeLayout(treeData, expandedNodes),
    [treeData, expandedNodes]
  );

  // D3 zoom setup
  useEffect(() => {
    if (!svgRef.current) return;

    const zoomBehavior = d3Zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        setTransform({ x: event.transform.x, y: event.transform.y, k: event.transform.k });
      });

    zoomRef.current = zoomBehavior;
    select(svgRef.current).call(zoomBehavior);

    return () => {
      select(svgRef.current).on('.zoom', null);
    };
  }, []);

  // Center tree on initial load
  useEffect(() => {
    if (!svgRef.current || !zoomRef.current || nodes.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    const rootNode = nodes[0];
    if (!rootNode) return;

    const initialTransform = zoomIdentity
      .translate(width / 2 - rootNode.x, 40)
      .scale(0.75);

    select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, initialTransform);
  }, [treeData]);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
  }, []);

  const handleResetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current || !containerRef.current || nodes.length === 0) return;
    const { width } = containerRef.current.getBoundingClientRect();
    const rootNode = nodes[0];
    const resetTransform = zoomIdentity.translate(width / 2 - rootNode.x, 40).scale(0.75);
    select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, resetTransform);
  }, [nodes]);

  const handleNodeSelect = useCallback((node) => {
    selectNode(node.data);
    if (onNodeSelect) onNodeSelect(node.data);
  }, [selectNode, onNodeSelect]);

  const handleExportPdf = useCallback(async () => {
    const { exportTreeAsPdf } = await import('../../utils/exportPdf');
    const { data: fullTree } = await api.get('/tree');
    await exportTreeAsPdf(fullTree, 'Paudyal Family Lineage');
  }, []);

  const highlightSet = useMemo(() => new Set(highlightedPath), [highlightedPath]);

  if (!treeData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading family tree...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <TreeControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onExportPdf={handleExportPdf}
      />

      {/* SVG layer for edges */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: 'grab' }}
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {links.map((link, i) => (
            <path
              key={`${link.source.id}-${link.target.id}-${i}`}
              d={generateLinkPath(link.source, link.target)}
              className={`tree-edge ${highlightSet.has(link.source.id) && highlightSet.has(link.target.id) ? 'highlighted' : ''}`}
            />
          ))}
        </g>
      </svg>

      {/* HTML layer for node cards */}
      <div
        ref={contentRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
          transformOrigin: '0 0',
        }}
      >
        {nodes.map(node => (
          <div key={node.id} className="pointer-events-auto" style={{ position: 'absolute', left: 0, top: 0 }}>
            <TreeNode
              node={node}
              isSelected={selectedNode?.id === node.id}
              isHighlighted={highlightSet.has(node.id)}
              onSelect={handleNodeSelect}
              onToggle={toggleExpanded}
              isDark={isDark}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
