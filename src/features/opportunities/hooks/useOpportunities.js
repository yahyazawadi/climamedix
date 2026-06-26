import { useState, useEffect } from 'preact/hooks';
import { fetchOpportunities } from '../services/opportunityService';

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (active = true) => {
    try {
      setLoading(true);
      const data = await fetchOpportunities();
      if (active) {
        setOpportunities(data);
        setError(null);
      }
    } catch (err) {
      if (active) {
        setError(err.message || 'Failed to fetch opportunities');
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let active = true;
    load(active);
    return () => {
      active = false;
    };
  }, []);

  return { opportunities, loading, error, refreshOpportunities: () => load(true) };
}
