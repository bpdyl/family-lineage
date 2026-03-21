import { ChevronDown, ChevronRight, User } from 'lucide-react';
import { genderColors, genderColorsDark } from '../../utils/colorSchemes';
import { NODE_WIDTH, NODE_HEIGHT } from '../../utils/treeLayout';

export default function TreeNode({ node, isSelected, isHighlighted, onSelect, onToggle, isDark }) {
  const colors = isDark ? genderColorsDark : genderColors;
  const palette = colors[node.data.gender] || colors.male;

  const displayNameNp = node.data.name_np || '(अज्ञात)';
  const displayNameEn = node.data.name_en || '(Unknown)';
  const spouseName = node.data.spouse_np || node.data.spouse_en || '';

  return (
    <div
      className={`tree-node-card absolute rounded-xl border-l-4 shadow-sm overflow-hidden
        ${isSelected ? 'selected ring-2 ring-primary-500' : ''}
        ${isHighlighted ? 'highlighted-path' : ''}
      `}
      style={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        left: node.x - NODE_WIDTH / 2,
        top: node.y,
        backgroundColor: isDark ? 'var(--color-surface-secondary)' : 'var(--color-surface)',
        borderTop: `1px solid ${isSelected ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
        borderRight: `1px solid ${isSelected ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
        borderBottom: `1px solid ${isSelected ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
        borderLeft: `4px solid ${palette.border}`,
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(node); }}
    >
      <div className="flex items-start gap-2.5 p-2.5 h-full">
        {/* Avatar */}
        <div
          className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-0.5"
          style={{ backgroundColor: palette.bg }}
        >
          {node.data.image_path ? (
            <img src={node.data.image_path} alt="" className="w-full h-full rounded-lg object-cover" />
          ) : (
            <User size={18} style={{ color: palette.accent }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-nepali text-sm font-semibold leading-tight truncate text-[var(--color-text-primary)]" title={displayNameNp}>
            {displayNameNp}
          </p>
          <p className="text-[11px] text-[var(--color-text-secondary)] truncate leading-tight" title={displayNameEn}>
            {displayNameEn}
          </p>
          {spouseName && (
            <p className="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5 leading-tight">
              <span className="font-nepali">♥ {spouseName}</span>
            </p>
          )}

          {/* Expand/Collapse */}
          {node.hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
              className="flex items-center gap-1 mt-1 text-[10px] px-1.5 py-0.5 rounded-md transition-colors hover:bg-[var(--color-surface-tertiary)]"
              style={{ color: palette.accent }}
            >
              {node.isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {node.isExpanded ? 'Collapse' : `${node.childCount} children`}
            </button>
          )}
        </div>

        {/* Gender indicator dot */}
        <div
          className="shrink-0 w-2 h-2 rounded-full mt-1"
          style={{ backgroundColor: palette.accent }}
          title={node.data.gender}
        />
      </div>
    </div>
  );
}
