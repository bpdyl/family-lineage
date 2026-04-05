import { useState } from 'react';
import { FileDown, FileJson, Loader2, Lock, RefreshCw, Database, Cloud, CheckCircle } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function ExportPage() {
  const [jsonExporting, setJsonExporting] = useState(false);
  const [seedExporting, setSeedExporting] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [repairingRoots, setRepairingRoots] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const { isAuthenticated, isAdmin } = useAuthStore();
  const hasAccess = isAuthenticated && isAdmin();

  function showStatus(message, isError = false) {
    setStatusMessage({ text: message, isError });
    setTimeout(() => setStatusMessage(null), 4000);
  }

  async function handleJsonExport() {
    setJsonExporting(true);
    try {
      const { data } = await api.get('/tree/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family_lineage_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus('JSON exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      showStatus('JSON export failed', true);
    } finally {
      setJsonExporting(false);
    }
  }

  async function handleSeedExport() {
    setSeedExporting(true);
    try {
      const { data } = await api.get('/tree/export/seed');
      const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family_lineage_seed_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus('Seed format JSON exported successfully');
    } catch (err) {
      console.error('Seed export failed:', err);
      showStatus('Seed export failed', true);
    } finally {
      setSeedExporting(false);
    }
  }

  async function handleSyncSeed() {
    setSyncing(true);
    try {
      const { data } = await api.post('/tree/sync-seed');
      showStatus(data.message || 'Seed file synced successfully');
    } catch (err) {
      console.error('Sync failed:', err);
      showStatus('Seed file sync failed', true);
    } finally {
      setSyncing(false);
    }
  }

  async function handleBackupToDrive() {
    setBackingUp(true);
    try {
      const { data } = await api.post('/tree/backup-drive');
      showStatus(data.message || 'Backed up to Google Drive successfully');
    } catch (err) {
      console.error('Backup failed:', err);
      const msg = err.response?.data?.error || 'Google Drive backup failed';
      showStatus(msg, true);
    } finally {
      setBackingUp(false);
    }
  }

  async function handleCleanupPlaceholders() {
    setCleaning(true);
    try {
      const { data } = await api.post('/tree/cleanup-placeholders');
      const removed = data?.result?.removed ?? 0;
      showStatus(`Placeholder cleanup complete. Removed ${removed} duplicates.`);
    } catch (err) {
      console.error('Cleanup failed:', err);
      const msg = err.response?.data?.error || 'Placeholder cleanup failed';
      showStatus(msg, true);
    } finally {
      setCleaning(false);
    }
  }

  async function handleRootRepairSync() {
    setRepairingRoots(true);
    try {
      const { data } = await api.post('/tree/root-repair-sync');
      const result = data?.result || {};
      const before = result.beforeCount ?? 0;
      const after = result.afterCount ?? 0;
      const roots = result.rootCount ?? 0;
      showStatus(`Root repair full sync complete. Members: ${before} -> ${after}, roots: ${roots}.`);
    } catch (err) {
      console.error('Root repair full sync failed:', err);
      const msg = err.response?.data?.error || 'Root repair full sync failed';
      showStatus(msg, true);
    } finally {
      setRepairingRoots(false);
    }
  }

  async function handlePdfExport() {
    setPdfExporting(true);
    try {
      const { exportTreeAsPdf } = await import('../utils/exportPdf');
      const { data: fullTree } = await api.get('/tree');
      await exportTreeAsPdf(fullTree, 'Paudyal Family Lineage');
      showStatus('PDF exported successfully');
    } catch (err) {
      console.error('PDF export failed:', err);
      showStatus('PDF export failed', true);
    } finally {
      setPdfExporting(false);
    }
  }

  if (!hasAccess) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Export</h2>
          <p className="text-xs font-nepali text-[var(--color-text-muted)] mt-0.5">डाटा निर्यात</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm flex items-center gap-3">
          <Lock size={20} className="text-[var(--color-text-muted)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Admin login required to export data. Please log in as an administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Export & Backup</h2>
        <p className="text-xs font-nepali text-[var(--color-text-muted)] mt-0.5">डाटा निर्यात र ब्याकअप</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Download, sync, and backup your family tree data.</p>
      </div>

      {statusMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${statusMessage.isError ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
          <CheckCircle size={16} />
          {statusMessage.text}
        </div>
      )}

      <div className="space-y-4">
        {/* JSON Export (full format) */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <FileJson size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--color-text-primary)]">JSON Export</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Download the complete family tree with all fields and computed metadata.</p>
              <button
                onClick={handleJsonExport}
                disabled={jsonExporting}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {jsonExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                Download JSON
              </button>
            </div>
          </div>
        </div>

        {/* Seed Format Export */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Database size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--color-text-primary)]">Seed Format Export</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Download in the same format as the seed file (family_lineage.json). Use this for backups that can be re-imported.</p>
              <button
                onClick={handleSeedExport}
                disabled={seedExporting}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {seedExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                Download Seed JSON
              </button>
            </div>
          </div>
        </div>

        {/* PDF Export */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <FileDown size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--color-text-primary)]">PDF Export</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Generate a PDF of the complete family tree rendered at full size.</p>
              <button
                onClick={handlePdfExport}
                disabled={pdfExporting}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] disabled:opacity-50 transition-colors"
              >
                {pdfExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                {pdfExporting ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--color-border)] my-2" />
        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Sync & Backup</h3>

        {/* Root Repair Full Sync */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <RefreshCw size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--color-text-primary)]">Root Repair Full Sync</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Rebuild all members from family_lineage.json to remove legacy duplicate root branches. Use this when duplicate people appear in search.</p>
              <button
                onClick={handleRootRepairSync}
                disabled={repairingRoots}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {repairingRoots ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {repairingRoots ? 'Repairing...' : 'Run Root Repair Sync'}
              </button>
            </div>
          </div>
        </div>

        {/* Sync Seed File */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <RefreshCw size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--color-text-primary)]">Sync Seed File</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Write current database state back to family_lineage.json on the server. This happens automatically on edits, but you can trigger it manually here.</p>
              <button
                onClick={handleSyncSeed}
                disabled={syncing}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Google Drive Backup */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              <Cloud size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--color-text-primary)]">Google Drive Backup</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Backup the current data to Google Drive. This also happens automatically when members are added or updated.</p>
              <button
                onClick={handleBackupToDrive}
                disabled={backingUp}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {backingUp ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />}
                {backingUp ? 'Backing up...' : 'Backup to Drive'}
              </button>
            </div>
          </div>
        </div>

        {/* Placeholder Cleanup */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              <Database size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--color-text-primary)]">Cleanup Placeholder Duplicates</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Remove duplicate unnamed placeholder members left from older imports. Keeps one record and preserves child links safely.</p>
              <button
                onClick={handleCleanupPlaceholders}
                disabled={cleaning}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {cleaning ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                {cleaning ? 'Cleaning...' : 'Run Cleanup'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
