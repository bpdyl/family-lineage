import { useState } from 'react';
import { GitFork, Loader2, Search, Heart } from 'lucide-react';
import api from '../../services/api';

export default function RelationshipResolver({ members }) {
  const [queryA, setQueryA] = useState('');
  const [queryB, setQueryB] = useState('');
  const [memberA, setMemberA] = useState(null);
  const [memberB, setMemberB] = useState(null);
  const [resultsA, setResultsA] = useState([]);
  const [resultsB, setResultsB] = useState([]);
  const [relationship, setRelationship] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function searchLocal(query, setter) {
    if (!query || query.length < 2) { setter([]); return; }
    const q = query.toLowerCase();
    const results = members.filter(m =>
      (m.name_en || '').toLowerCase().includes(q) || (m.name_np || '').includes(query)
    ).slice(0, 10);
    setter(results);
  }

  async function resolve() {
    if (!memberA || !memberB) return;
    setLoading(true);
    setError('');
    setRelationship(null);
    try {
      const { data } = await api.get(`/graph/relationship?a=${memberA.id}&b=${memberB.id}`);
      setRelationship(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resolve relationship');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PersonPicker
          label="Person A" labelNp="व्यक्ति क"
          query={queryA} setQuery={q => { setQueryA(q); searchLocal(q, setResultsA); }}
          results={resultsA} selected={memberA}
          onSelect={m => { setMemberA(m); setResultsA([]); setQueryA(m.name_en || m.name_np); }}
        />
        <PersonPicker
          label="Person B" labelNp="व्यक्ति ख"
          query={queryB} setQuery={q => { setQueryB(q); searchLocal(q, setResultsB); }}
          results={resultsB} selected={memberB}
          onSelect={m => { setMemberB(m); setResultsB([]); setQueryB(m.name_en || m.name_np); }}
        />
      </div>

      <button
        onClick={resolve}
        disabled={!memberA || !memberB || loading}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <GitFork size={16} />}
        Find Relationship
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {relationship && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm fade-in">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-4">
              <PersonBadge member={memberA} />
              <Heart size={20} className="text-pink-500" />
              <PersonBadge member={memberB} />
            </div>

            <div className="py-4">
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{relationship.relationship_en}</p>
              <p className="font-nepali text-lg text-primary-600 dark:text-primary-400">{relationship.relationship_np}</p>
            </div>

            {relationship.lca_name_en && (
              <div className="text-xs text-[var(--color-text-muted)] space-y-1">
                <p>Common Ancestor: <span className="font-medium text-[var(--color-text-secondary)]">{relationship.lca_name_en}</span> (<span className="font-nepali">{relationship.lca_name_np}</span>)</p>
                <p>Generations from ancestor: {relationship.generation_distance_a} and {relationship.generation_distance_b}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonPicker({ label, labelNp, query, setQuery, results, selected, onSelect }) {
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
        {label} <span className="font-nepali text-[var(--color-text-muted)]">{labelNp}</span>
      </label>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Search size={14} className="text-[var(--color-text-muted)]" />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." className="flex-1 text-sm bg-transparent outline-none text-[var(--color-text-primary)]" />
      </div>
      {selected && <p className="text-[10px] text-green-600 mt-1">Selected: {selected.name_en}</p>}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
          {results.map(m => (
            <button key={m.id} onClick={() => onSelect(m)} className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-tertiary)] border-b border-[var(--color-border)] last:border-0">
              <span className="font-nepali">{m.name_np}</span> <span className="text-[var(--color-text-muted)]">{m.name_en}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PersonBadge({ member }) {
  if (!member) return null;
  return (
    <div className="px-3 py-2 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
      <p className="font-nepali text-sm font-medium text-[var(--color-text-primary)]">{member.name_np}</p>
      <p className="text-[10px] text-[var(--color-text-muted)]">{member.name_en}</p>
    </div>
  );
}
