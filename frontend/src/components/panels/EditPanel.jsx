import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Upload, Loader2, UserPlus } from 'lucide-react';
import api from '../../services/api';
import useTreeStore from '../../store/treeStore';
import useAuthStore from '../../store/authStore';
import NodeDetail from './NodeDetail';

export default function EditPanel({ member, onClose }) {
  const isAdmin = useAuthStore(s => s.isAuthenticated && s.user?.role === 'admin');
  const refreshMember = useTreeStore(s => s.refreshMember);

  const [form, setForm] = useState({});
  const [extras, setExtras] = useState([]);
  const [newExtra, setNewExtra] = useState({ key: '', value: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childForm, setChildForm] = useState({ name_np: '', name_en: '', relationship: 'son', spouse_np: '', spouse_en: '', notes: '' });

  useEffect(() => {
    if (!member) return;
    setForm({
      name_np: member.name_np || '',
      name_en: member.name_en || '',
      spouse_np: member.spouse_np || '',
      spouse_en: member.spouse_en || '',
      relationship: member.relationship || 'son',
      notes: member.notes || '',
    });
    setExtras(
      member.extras ? Object.entries(member.extras).map(([k, v]) => ({ key: k, value: v })) : []
    );
    setMessage(null);
    setShowAddChild(false);
  }, [member]);

  if (!member) return null;

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/members/${member.id}`, form);

      if (extras.length > 0) {
        await api.post(`/members/${member.id}/extras`, {
          fields: extras.map(e => ({ field_key: e.key, field_value: e.value })),
        });
      }

      await refreshMember(member.id);
      setMessage({ type: 'success', text: 'Saved successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      await api.post(`/members/${member.id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshMember(member.id);
      setMessage({ type: 'success', text: 'Image uploaded' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Upload failed' });
    }
  }

  async function handleAddChild() {
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/members', { ...childForm, parent_id: member.id });
      await refreshMember(member.id);
      setShowAddChild(false);
      setChildForm({ name_np: '', name_en: '', relationship: 'son', spouse_np: '', spouse_en: '', notes: '' });
      setMessage({ type: 'success', text: 'Child added successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to add child' });
    } finally {
      setSaving(false);
    }
  }

  function addExtraField() {
    if (!newExtra.key.trim()) return;
    setExtras([...extras, { key: newExtra.key.trim(), value: newExtra.value }]);
    setNewExtra({ key: '', value: '' });
  }

  if (!isAdmin) {
    return (
      <div className="slide-panel fixed right-0 top-[var(--header-height)] bottom-0 w-80 bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-xl z-30 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Member Details</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--color-surface-tertiary)]"><X size={16} /></button>
        </div>
        <div className="p-4">
          <NodeDetail member={member} />
        </div>
      </div>
    );
  }

  return (
    <div className="slide-panel fixed right-0 top-[var(--header-height)] bottom-0 w-96 bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-xl z-30 overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
        <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Edit Member</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-[var(--color-surface-tertiary)]"><X size={16} /></button>
      </div>

      {message && (
        <div className={`mx-4 mt-3 p-2.5 text-xs rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
          {message.text}
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Image Upload */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-[var(--color-surface-tertiary)] flex items-center justify-center overflow-hidden">
            {member.image_path ? (
              <img src={member.image_path} alt="" className="w-full h-full object-cover" />
            ) : (
              <Upload size={20} className="text-[var(--color-text-muted)]" />
            )}
          </div>
          <label className="cursor-pointer px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
            Upload Photo
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>

        {/* Name fields */}
        <FieldGroup label="Name (Nepali)" value={form.name_np} onChange={v => setForm({ ...form, name_np: v })} className="font-nepali" />
        <FieldGroup label="Name (English)" value={form.name_en} onChange={v => setForm({ ...form, name_en: v })} />
        <FieldGroup label="Spouse (Nepali)" value={form.spouse_np} onChange={v => setForm({ ...form, spouse_np: v })} className="font-nepali" />
        <FieldGroup label="Spouse (English)" value={form.spouse_en} onChange={v => setForm({ ...form, spouse_en: v })} />

        {/* Relationship */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Relationship</label>
          <select
            value={form.relationship}
            onChange={e => setForm({ ...form, relationship: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="son">Son (छोरा)</option>
            <option value="daughter">Daughter (छोरी)</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
          />
        </div>

        {/* Extra Fields */}
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Additional Fields</h4>
          {extras.map((ex, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={ex.key}
                onChange={e => { const n = [...extras]; n[i].key = e.target.value; setExtras(n); }}
                placeholder="Key"
                className="flex-1 px-2 py-1.5 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
              />
              <input
                value={ex.value}
                onChange={e => { const n = [...extras]; n[i].value = e.target.value; setExtras(n); }}
                placeholder="Value"
                className="flex-1 px-2 py-1.5 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
              />
              <button onClick={() => setExtras(extras.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input value={newExtra.key} onChange={e => setNewExtra({ ...newExtra, key: e.target.value })} placeholder="New field name" className="flex-1 px-2 py-1.5 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <input value={newExtra.value} onChange={e => setNewExtra({ ...newExtra, value: e.target.value })} placeholder="Value" className="flex-1 px-2 py-1.5 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <button onClick={addExtraField} className="px-2 py-1 text-xs rounded bg-[var(--color-surface-tertiary)] hover:bg-[var(--color-border)] transition-colors">
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {/* Add Child */}
        <div className="pt-3 border-t border-[var(--color-border)]">
          {!showAddChild ? (
            <button
              onClick={() => setShowAddChild(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              <UserPlus size={16} />
              Add Child
            </button>
          ) : (
            <div className="space-y-3 p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Add New Child</h4>
              <FieldGroup label="Name (Nepali)" value={childForm.name_np} onChange={v => setChildForm({ ...childForm, name_np: v })} className="font-nepali" />
              <FieldGroup label="Name (English)" value={childForm.name_en} onChange={v => setChildForm({ ...childForm, name_en: v })} />
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Relationship</label>
                <select value={childForm.relationship} onChange={e => setChildForm({ ...childForm, relationship: e.target.value })} className="w-full px-2 py-1.5 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                  <option value="son">Son (छोरा)</option>
                  <option value="daughter">Daughter (छोरी)</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddChild} disabled={saving} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Add
                </button>
                <button onClick={() => setShowAddChild(false)} className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)]">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 text-[10px] text-[var(--color-text-muted)]">ID: {member.id}</div>
      </div>
    </div>
  );
}

function FieldGroup({ label, value, onChange, className = '' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${className}`}
      />
    </div>
  );
}
