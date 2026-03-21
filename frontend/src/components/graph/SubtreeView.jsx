import { useState, useMemo, useCallback } from 'react';
import { Search, TreePine, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import FamilyTree from '../tree/FamilyTree';
import useTreeStore from '../../store/treeStore';

export default function SubtreeView({ members }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [subtreeRoot, setSubtreeRoot] = useState(null);
  const [subtreeData, setSubtreeData] = useState(null);
  const [loading, setLoading] = useState(false);

  const originalTreeData = useTreeStore(s => s.treeData);

  function searchLocal(q) {
    setQuery(q);
    if (!q || q.length < 2) { setResults([]); return; }
    const lower = q.toLowerCase();
    setResults(members.filter(m =>
      (m.name_en || '').toLowerCase().includes(lower) || (m.name_np || '').includes(q)
    ).slice(0, 10));
  }

  async function loadSubtree(member) {
    setSubtreeRoot(member);
    setResults([]);
    setQuery(member.name_en || member.name_np);
    setLoading(true);
    try {
      const { data } = await api.get(`/tree/subtree/${member.id}`);
      setSubtreeData(data);
    } catch {
      setSubtreeData(null);
    } finally {
      setLoading(false);
    }
  }

  function clearSubtree() {
    setSubtreeRoot(null);
    setSubtreeData(null);
    setQuery('');
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
        <div className="flex items-center gap-3">
          {subtreeRoot && (
            <button onClick={clearSubtree} className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)]">
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="relative flex-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              <Search size={14} className="text-[var(--color-text-muted)]" />
              <input type="text" value={query} onChange={e => searchLocal(e.target.value)} placeholder="Select a person to view their subtree..." className="flex-1 text-sm bg-transparent outline-none text-[var(--color-text-primary)]" />
            </div>
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                {results.map(m => (
                  <button key={m.id} onClick={() => loadSubtree(m)} className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-tertiary)] border-b border-[var(--color-border)] last:border-0">
                    <span className="font-nepali">{m.name_np}</span> <span className="text-[var(--color-text-muted)]">{m.name_en}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {subtreeRoot && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Showing subtree of: <span className="font-medium text-[var(--color-text-primary)] font-nepali">{subtreeRoot.name_np}</span> ({subtreeRoot.name_en})
          </p>
        )}
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subtreeData ? (
          <SubtreeTreeView data={subtreeData} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
            <TreePine size={48} className="mb-3 opacity-30" />
            <p className="text-sm">Search and select a person to view their subtree</p>
            <p className="text-xs font-nepali mt-1">व्यक्ति खोजेर उनको उपवंश हेर्नुहोस्</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SubtreeTreeView({ data }) {
  const expandedNodes = useMemo(() => {
    const set = new Set();
    function collect(node) {
      set.add(node.id);
      if (node.children) node.children.forEach(collect);
    }
    collect(data);
    return set;
  }, [data]);

  // Override tree store temporarily for subtree
  const store = useTreeStore.getState();

  return (
    <div className="h-full">
      <FamilyTree />
    </div>
  );
}
