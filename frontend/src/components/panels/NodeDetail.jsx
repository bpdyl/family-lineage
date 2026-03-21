import { User, Heart, GitBranch, Hash, Layers, BookOpen } from 'lucide-react';
import { genderColors } from '../../utils/colorSchemes';

export default function NodeDetail({ member }) {
  if (!member) return null;

  const palette = genderColors[member.gender] || genderColors.male;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: palette.bg }}
        >
          {member.image_path ? (
            <img src={member.image_path} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            <User size={24} style={{ color: palette.accent }} />
          )}
        </div>
        <div>
          <h3 className="font-nepali text-lg font-bold text-[var(--color-text-primary)]">
            {member.name_np || '(अज्ञात)'}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">{member.name_en || '(Unknown)'}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2.5">
        {(member.spouse_np || member.spouse_en) && (
          <DetailRow icon={Heart} label="Spouse" valueNp={member.spouse_np} valueEn={member.spouse_en} />
        )}
        <DetailRow icon={GitBranch} label="Relationship" valueEn={member.relationship || 'N/A'} />
        <DetailRow icon={Hash} label="Generation" valueEn={`Level ${member.generation_level}`} />
        <DetailRow icon={Layers} label="Branch" valueEn={member.family_branch_root || 'N/A'} />
        {member.notes && <DetailRow icon={BookOpen} label="Notes" valueEn={member.notes} />}
      </div>

      {/* Extra fields */}
      {member.extras && Object.keys(member.extras).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Additional Info</h4>
          <div className="space-y-1.5">
            {Object.entries(member.extras).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)] capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-[var(--color-text-primary)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-[var(--color-border)]">
        <p className="text-[10px] text-[var(--color-text-muted)]">ID: {member.id}</p>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, valueNp, valueEn }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-[var(--color-text-muted)] mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{label}</p>
        {valueNp && <p className="font-nepali text-sm text-[var(--color-text-primary)]">{valueNp}</p>}
        {valueEn && <p className="text-sm text-[var(--color-text-secondary)]">{valueEn}</p>}
      </div>
    </div>
  );
}
