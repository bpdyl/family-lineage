import { ZoomIn, ZoomOut, Maximize2, Expand, Shrink, FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function TreeControls({ onZoomIn, onZoomOut, onResetZoom, onExpandAll, onCollapseAll, onExportPdf }) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await onExportPdf?.();
    } finally {
      setExporting(false);
    }
  }

  const btnClass = `p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] 
    hover:bg-[var(--color-surface-tertiary)] transition-colors shadow-sm text-[var(--color-text-secondary)]`;

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
      <button onClick={onZoomIn} className={btnClass} title="Zoom In">
        <ZoomIn size={16} />
      </button>
      <button onClick={onZoomOut} className={btnClass} title="Zoom Out">
        <ZoomOut size={16} />
      </button>
      <button onClick={onResetZoom} className={btnClass} title="Reset View">
        <Maximize2 size={16} />
      </button>
      <div className="h-px bg-[var(--color-border)] my-1" />
      <button onClick={onExpandAll} className={btnClass} title="Expand All">
        <Expand size={16} />
      </button>
      <button onClick={onCollapseAll} className={btnClass} title="Collapse All">
        <Shrink size={16} />
      </button>
      <div className="h-px bg-[var(--color-border)] my-1" />
      <button onClick={handleExport} disabled={exporting} className={btnClass} title="Export as PDF">
        {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
      </button>
    </div>
  );
}
