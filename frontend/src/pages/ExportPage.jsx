import { useState } from 'react';
import { FileDown, FileJson, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function ExportPage() {
  const [jsonExporting, setJsonExporting] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

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
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setJsonExporting(false);
    }
  }

  async function handlePdfExport() {
    setPdfExporting(true);
    try {
      const { exportTreeAsPdf } = await import('../utils/exportPdf');
      const { data: fullTree } = await api.get('/tree');
      await exportTreeAsPdf(fullTree, 'Paudyal Family Lineage');
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setPdfExporting(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Export</h2>
        <p className="text-xs font-nepali text-[var(--color-text-muted)] mt-0.5">डाटा निर्यात</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Download your family tree data in various formats.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <FileJson size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--color-text-primary)]">JSON Export</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Download the complete family tree as a structured JSON file. Includes all members, relationships, and metadata.</p>
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

        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <FileDown size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--color-text-primary)]">PDF Export</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Generate a PDF of the complete family tree with all members expanded. The tree is rendered at full size and captured as a high-resolution image.</p>
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
      </div>
    </div>
  );
}
