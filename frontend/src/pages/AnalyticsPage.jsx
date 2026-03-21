import { useAnalytics } from '../hooks/useAnalytics';
import OverviewDashboard from '../components/analytics/OverviewDashboard';
import BranchAnalytics from '../components/analytics/BranchAnalytics';
import GenerationAnalytics from '../components/analytics/GenerationAnalytics';

export default function AnalyticsPage() {
  const { overview, branches, generations, loading } = useAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Family Overview</h2>
        <p className="text-xs font-nepali text-[var(--color-text-muted)] mt-0.5">परिवार विश्लेषण</p>
      </div>

      <OverviewDashboard data={overview} />

      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Branch Analytics</h2>
        <p className="text-xs font-nepali text-[var(--color-text-muted)] mt-0.5">शाखा विश्लेषण</p>
      </div>
      <BranchAnalytics data={branches} />

      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Generation Analytics</h2>
        <p className="text-xs font-nepali text-[var(--color-text-muted)] mt-0.5">पुस्ता विश्लेषण</p>
      </div>
      <GenerationAnalytics data={generations} />
    </div>
  );
}
