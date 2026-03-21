import { useEffect, useState } from 'react';
import RelationshipResolver from '../components/graph/RelationshipResolver';
import api from '../services/api';

export default function RelationshipPage() {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api.get('/members').then(r => setMembers(r.data)).catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Relationship Resolver</h2>
        <p className="text-xs font-nepali text-[var(--color-text-muted)] mt-0.5">दुई व्यक्तिबीचको नाता पत्ता लगाउनुहोस्</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Discover how two family members are related using the Lowest Common Ancestor algorithm.</p>
      </div>
      <RelationshipResolver members={members} />
    </div>
  );
}
