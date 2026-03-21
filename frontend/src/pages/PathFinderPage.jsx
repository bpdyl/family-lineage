import { useEffect, useState } from 'react';
import PathFinder from '../components/graph/PathFinder';
import api from '../services/api';

export default function PathFinderPage() {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api.get('/members').then(r => setMembers(r.data)).catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Path Finder</h2>
        <p className="text-xs font-nepali text-[var(--color-text-muted)] mt-0.5">दुई व्यक्तिबीचको बाटो खोज्नुहोस्</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Find the connection path between any two family members.</p>
      </div>
      <PathFinder members={members} />
    </div>
  );
}
