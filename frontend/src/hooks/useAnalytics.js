import { useState, useEffect } from 'react';
import api from '../services/api';

export function useAnalytics() {
  const [overview, setOverview] = useState(null);
  const [branches, setBranches] = useState([]);
  const [generations, setGenerations] = useState([]);
  const [missingData, setMissingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [ov, br, gen, miss] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/branches'),
          api.get('/analytics/generations'),
          api.get('/analytics/missing'),
        ]);
        setOverview(ov.data);
        setBranches(br.data);
        setGenerations(gen.data);
        setMissingData(miss.data);
      } catch (err) {
        console.error('Analytics fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  return { overview, branches, generations, missingData, loading };
}
