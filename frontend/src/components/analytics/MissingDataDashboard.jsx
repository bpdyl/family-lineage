import { AlertTriangle } from 'lucide-react';

export default function MissingDataDashboard({ data, onMemberClick }) {
  if (!data) return null;

  const sections = [
    { title: 'Missing Nepali Name', titleNp: 'नेपाली नाम नभएका', items: data.missing_name_np, key: 'name_np' },
    { title: 'Missing English Name', titleNp: 'अंग्रेजी नाम नभएका', items: data.missing_name_en, key: 'name_en' },
    { title: 'Missing Spouse Info', titleNp: 'जीवनसाथी जानकारी नभएका', items: data.missing_spouse, key: 'spouse' },
    { title: 'No Children Recorded', titleNp: 'सन्तान नभएका', items: data.no_children_recorded, key: 'children' },
  ];

  return (
    <div className="space-y-6">
      {sections.map(section => (
        <div key={section.key} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 p-4 border-b border-[var(--color-border)]">
            <AlertTriangle size={16} className="text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{section.title}</h3>
              <p className="text-[10px] font-nepali text-[var(--color-text-muted)]">{section.titleNp}</p>
            </div>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {section.items?.length || 0}
            </span>
          </div>

          {section.items && section.items.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)]">
              {section.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => onMemberClick?.(item)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[var(--color-surface-secondary)] transition-colors"
                >
                  <div>
                    <p className="text-sm text-[var(--color-text-primary)]">
                      {item.name_np || item.name_en || <span className="italic text-[var(--color-text-muted)]">(No name)</span>}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      Gen {item.generation_level} &middot; {item.family_branch_root || 'No branch'}
                    </p>
                  </div>
                  <span className="text-[10px] text-primary-500">View &rarr;</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="p-4 text-sm text-[var(--color-text-muted)] text-center">No missing data in this category</p>
          )}
        </div>
      ))}
    </div>
  );
}
