import { NavLink } from 'react-router-dom';
import { TreePine, BarChart3, GitFork, Route, AlertTriangle, FileDown, X } from 'lucide-react';

const navItems = [
  { to: '/', icon: TreePine, label: 'Family Tree', labelNp: 'वंशवृक्ष' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', labelNp: 'विश्लेषण' },
  { to: '/path-finder', icon: Route, label: 'Path Finder', labelNp: 'सम्बन्ध खोज' },
  { to: '/relationship', icon: GitFork, label: 'Relationship', labelNp: 'नाता' },
  { to: '/missing-data', icon: AlertTriangle, label: 'Missing Data', labelNp: 'अपूर्ण डाटा' },
  { to: '/export', icon: FileDown, label: 'Export', labelNp: 'निर्यात' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-[var(--sidebar-width)]
        bg-[var(--color-surface)] border-r border-[var(--color-border)]
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${open ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
              <span className="font-nepali">वंशावली</span>
            </h1>
            <p className="text-xs text-[var(--color-text-muted)]">Family Lineage</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-[var(--color-surface-tertiary)]">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-medium'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]'
                }
              `}
            >
              <item.icon size={18} />
              <div className="flex flex-col">
                <span>{item.label}</span>
                <span className="text-[10px] font-nepali text-[var(--color-text-muted)] leading-tight">{item.labelNp}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--color-border)]">
          <p className="text-[10px] text-[var(--color-text-muted)] text-center">
            <span className="font-nepali">पौड्याल वंशावली</span> &middot; Paudyal Family
          </p>
        </div>
      </aside>
    </>
  );
}
