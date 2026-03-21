import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from 'recharts';

export default function GenerationAnalytics({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Stacked bar: gender per generation */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          Gender Distribution per Generation
          <span className="font-nepali text-xs text-[var(--color-text-muted)] ml-2">पुस्ता अनुसार लिङ्ग वितरण</span>
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="generation"
                tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                tickFormatter={v => `Gen ${v}`}
              />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value, name) => [value, name === 'male' ? 'Male' : 'Female']}
                labelFormatter={v => `Generation ${v}`}
              />
              <Legend />
              <Bar dataKey="male" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Male" />
              <Bar dataKey="female" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} name="Female" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line chart: avg children per generation */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          Average Children per Generation
          <span className="font-nepali text-xs text-[var(--color-text-muted)] ml-2">पुस्ता अनुसार औसत सन्तान</span>
        </h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="generation"
                tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                tickFormatter={v => `Gen ${v}`}
              />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                labelFormatter={v => `Generation ${v}`}
              />
              <Line type="monotone" dataKey="avg_children" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Avg Children" />
              <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Total Members" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Generation table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-secondary)]">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase">Generation</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase">Total</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase">Male</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase">Female</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase">Avg Children</th>
              </tr>
            </thead>
            <tbody>
              {data.map(g => (
                <tr key={g.generation} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)]">
                  <td className="px-4 py-2.5 font-medium text-[var(--color-text-primary)]">Gen {g.generation}</td>
                  <td className="text-right px-4 py-2.5 text-[var(--color-text-secondary)]">{g.total}</td>
                  <td className="text-right px-4 py-2.5 text-blue-600">{g.male}</td>
                  <td className="text-right px-4 py-2.5 text-pink-600">{g.female}</td>
                  <td className="text-right px-4 py-2.5 text-[var(--color-text-secondary)]">{g.avg_children}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
