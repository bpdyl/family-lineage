import { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import useTreeStore from '../../store/treeStore';
import api from '../../services/api';

export default function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const debounceRef = useRef(null);

  const { search, searchResults, expandPath, selectNode, setHighlightedPath } = useTreeStore();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    setResults(searchResults);
    setOpen(searchResults.length > 0);
  }, [searchResults]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleJumpTo(member) {
    try {
      const { data: path } = await api.get(`/tree/ancestor-path/${member.id}`);
      const pathIds = path.map(p => p.id);
      expandPath(pathIds);
      setHighlightedPath(pathIds);
      selectNode(member);
      setOpen(false);
      setQuery('');

      setTimeout(() => setHighlightedPath([]), 5000);
    } catch (err) {
      console.error('Jump failed:', err);
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <Search size={16} className="text-[var(--color-text-muted)] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search name (English / नेपाली)..."
          className="flex-1 text-sm bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <X size={14} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl max-h-72 overflow-y-auto z-50">
          {results.map(member => (
            <button
              key={member.id}
              onClick={() => handleJumpTo(member)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--color-surface-tertiary)] transition-colors border-b border-[var(--color-border)] last:border-0"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: member.gender === 'female' ? '#ec4899' : '#3b82f6' }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-nepali text-sm font-medium truncate text-[var(--color-text-primary)]">
                  {member.name_np || '(अज्ञात)'}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                  {member.name_en || '(Unknown)'} &middot; Gen {member.generation_level}
                  {member.family_branch_root && ` &middot; ${member.family_branch_root}`}
                </p>
              </div>
              <MapPin size={14} className="text-[var(--color-text-muted)] shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
