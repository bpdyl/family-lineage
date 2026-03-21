import { Users, Layers, Baby, AlertCircle, TrendingUp } from 'lucide-react';

export default function OverviewDashboard({ data }) {
  if (!data) return null;

  const kpis = [
    { label: 'Total Members', labelNp: 'कुल सदस्य', value: data.total_members, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Generations', labelNp: 'पुस्ता', value: data.total_generations, icon: Layers, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400' },
    { label: 'Avg Children', labelNp: 'औसत सन्तान', value: data.avg_children_per_family, icon: Baby, color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' },
    { label: 'Male : Female', labelNp: 'पुरुष : महिला', value: `${data.male_count} : ${data.female_count}`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'Missing Data', labelNp: 'अपूर्ण डाटा', value: data.missing_data.total_missing, icon: AlertCircle, color: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map(kpi => (
        <div key={kpi.label} className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${kpi.color}`}>
              <kpi.icon size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{kpi.value}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">{kpi.label}</p>
          <p className="text-[10px] font-nepali text-[var(--color-text-muted)]">{kpi.labelNp}</p>
        </div>
      ))}
    </div>
  );
}
