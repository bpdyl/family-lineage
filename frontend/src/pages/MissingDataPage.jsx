import { useAnalytics } from '../hooks/useAnalytics';
import MissingDataDashboard from '../components/analytics/MissingDataDashboard';
import useTreeStore from '../store/treeStore';
import { useNavigate } from 'react-router-dom';

export default function MissingDataPage() {
  const { missingData, loading } = useAnalytics();
  const selectNode = useTreeStore(s => s.selectNode);
  const navigate = useNavigate();

  function handleMemberClick(member) {
    selectNode(member);
    navigate('/');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Missing Data Dashboard</h2>
        <p className="text-xs font-nepali text-[var(--color-text-muted)] mt-0.5">अपूर्ण डाटा ड्यासबोर्ड</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Track and complete missing information across the family tree.</p>
      </div>
      <MissingDataDashboard data={missingData} onMemberClick={handleMemberClick} />
    </div>
  );
}
