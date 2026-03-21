import { useState } from 'react';
import { Route, ArrowRight, Loader2, Search } from 'lucide-react';
import api from '../../services/api';
import useTreeStore from '../../store/treeStore';

export default function PathFinder({ members }) {
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromMember, setFromMember] = useState(null);
  const [toMember, setToMember] = useState(null);
  const [fromResults, setFromResults] = useState([]);
  const [toResults, setToResults] = useState([]);
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { expandPath, setHighlightedPath } = useTreeStore();

  function searchLocal(query, setter) {
    if (!query || query.length < 2) { setter([]); return; }
    const q = query.toLowerCase();
    const results = members.filter(m =>
      (m.name_en || '').toLowerCase().includes(q) || (m.name_np || '').includes(query)
    ).slice(0, 10);
    setter(results);
  }

  async function findPath() {
    if (!fromMember || !toMember) return;
    setLoading(true);
    setError('');
    setPath(null);
    try {
      const { data } = await api.get(`/graph/path?from=${fromMember.id}&to=${toMember.id}`);
      setPath(data);

      const pathIds = data.path.map(p => p.id);
      expandPath(pathIds);
      setHighlightedPath(pathIds);
      setTimeout(() => setHighlightedPath([]), 8000);
    } catch (err) {
      setError(err.response?.data?.error || 'Path not found');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PersonSelector
          label="From (Person A)"
          labelNp="बाट (व्यक्ति क)"
          query={fromQuery}
          setQuery={(q) => { setFromQuery(q); searchLocal(q, setFromResults); }}
          results={fromResults}
          selected={fromMember}
          onSelect={(m) => { setFromMember(m); setFromResults([]); setFromQuery(m.name_en || m.name_np); }}
        />
        <PersonSelector
          label="To (Person B)"
          labelNp="सम्म (व्यक्ति ख)"
          query={toQuery}
          setQuery={(q) => { setToQuery(q); searchLocal(q, setToResults); }}
          results={toResults}
          selected={toMember}
          onSelect={(m) => { setToMember(m); setToResults([]); setToQuery(m.name_en || m.name_np); }}
        />
      </div>

      <button
        onClick={findPath}
        disabled={!fromMember || !toMember || loading}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Route size={16} />}
        Find Path
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {path && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Path ({path.length} steps)
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            {path.path.map((node, i) => (
              <div key={node.id} className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                  <p className="font-nepali text-sm font-medium text-[var(--color-text-primary)]">{node.name_np || '?'}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{node.name_en || '?'}</p>
                </div>
                {i < path.path.length - 1 && <ArrowRight size={16} className="text-[var(--color-text-muted)]" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonSelector({ label, labelNp, query, setQuery, results, selected, onSelect }) {
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
        {label} <span className="font-nepali text-[var(--color-text-muted)]">{labelNp}</span>
      </label>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Search size={14} className="text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search name..."
          className="flex-1 text-sm bg-transparent outline-none text-[var(--color-text-primary)]"
        />
      </div>
      {selected && (
        <p className="text-[10px] text-green-600 mt-1">Selected: {selected.name_en} ({selected.name_np})</p>
      )}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
          {results.map(m => (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-tertiary)] border-b border-[var(--color-border)] last:border-0"
            >
              <span className="font-nepali">{m.name_np}</span>
              <span className="text-[var(--color-text-muted)] ml-2">{m.name_en}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
