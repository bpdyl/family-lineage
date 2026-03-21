import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ec4899', '#8b5cf6', '#f97316', '#06b6d4', '#ef4444'];

export default function BranchAnalytics({ data }) {
  if (!data || data.length === 0) return null;

  const mainBranches = data.filter(b => b.total_descendants > 1);

  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          Descendants per Branch
          <span className="font-nepali text-xs text-[var(--color-text-muted)] ml-2">शाखा अनुसार सन्तान</span>
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mainBranches} layout="vertical" margin={{ left: 100, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
              <YAxis type="category" dataKey="branch" tick={{ fontSize: 12, fill: 'var(--color-text-primary)' }} width={90} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="total_descendants" radius={[0, 4, 4, 0]}>
                {mainBranches.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Branch details table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Branch Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-secondary)]">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase">Branch</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase">Total</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase">Depth</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase">Leaves</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase">Male</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase">Female</th>
              </tr>
            </thead>
            <tbody>
              {mainBranches.map((b, i) => (
                <tr key={b.branch} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors">
                  <td className="px-4 py-2.5 font-medium text-[var(--color-text-primary)]">
                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {b.branch}
                  </td>
                  <td className="text-right px-4 py-2.5 text-[var(--color-text-secondary)]">{b.total_descendants}</td>
                  <td className="text-right px-4 py-2.5 text-[var(--color-text-secondary)]">{b.depth_span}</td>
                  <td className="text-right px-4 py-2.5 text-[var(--color-text-secondary)]">{b.leaf_count}</td>
                  <td className="text-right px-4 py-2.5 text-blue-600">{b.gender_distribution?.male || 0}</td>
                  <td className="text-right px-4 py-2.5 text-pink-600">{b.gender_distribution?.female || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
