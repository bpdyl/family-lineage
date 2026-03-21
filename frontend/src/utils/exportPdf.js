import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as d3 from 'd3';

const PDF_NODE_W = 280;
const PDF_NODE_H = 110;
const PDF_H_GAP = 40;
const PDF_V_GAP = 70;

export async function exportTreeAsPdf(treeData, title = 'Paudyal Family Lineage') {
  if (!treeData) return;

  const root = d3.hierarchy(treeData);
  const treeLayout = d3.tree()
    .nodeSize([PDF_NODE_W + PDF_H_GAP, PDF_NODE_H + PDF_V_GAP])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.15));
  treeLayout(root);

  const allNodes = [];
  const allLinks = [];
  root.each(n => allNodes.push(n));
  root.links().forEach(l => allLinks.push(l));

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of allNodes) {
    minX = Math.min(minX, n.x - PDF_NODE_W / 2);
    maxX = Math.max(maxX, n.x + PDF_NODE_W / 2);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y + PDF_NODE_H);
  }

  const pad = 50;
  const totalW = maxX - minX + pad * 2;
  const totalH = maxY - minY + pad * 2;
  const offX = -minX + pad;
  const offY = -minY + pad;

  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-99999px;top:0;width:${totalW}px;height:${totalH}px;background:#fff;font-family:'Noto Sans Devanagari',Inter,sans-serif;`;
  document.body.appendChild(container);

  // SVG edges
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(totalW));
  svg.setAttribute('height', String(totalH));
  svg.style.cssText = 'position:absolute;left:0;top:0;';
  container.appendChild(svg);

  for (const link of allLinks) {
    const sx = link.source.x + offX;
    const sy = link.source.y + PDF_NODE_H + offY;
    const tx = link.target.x + offX;
    const ty = link.target.y + offY;
    const my = (sy + ty) / 2;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', `M ${sx} ${sy} C ${sx} ${my}, ${tx} ${my}, ${tx} ${ty}`);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', '#cbd5e1');
    p.setAttribute('stroke-width', '1.5');
    svg.appendChild(p);
  }

  // Node cards
  for (const node of allNodes) {
    const x = node.x - PDF_NODE_W / 2 + offX;
    const y = node.y + offY;
    const d = node.data;
    const isFemale = d.gender === 'female' || d.relationship === 'daughter';
    const accent = isFemale ? '#ec4899' : '#3b82f6';
    const bg = isFemale ? '#fdf2f8' : '#eff6ff';

    const card = document.createElement('div');
    card.style.cssText = `
      position:absolute;left:${x}px;top:${y}px;width:${PDF_NODE_W}px;height:${PDF_NODE_H}px;
      background:#fff;border:1px solid #e2e8f0;border-left:5px solid ${accent};
      border-radius:10px;display:flex;align-items:flex-start;gap:10px;padding:12px;
      box-shadow:0 1px 2px rgba(0,0,0,0.04);box-sizing:border-box;
    `;

    const avatar = document.createElement('div');
    avatar.style.cssText = `
      width:40px;height:40px;border-radius:8px;background:${bg};
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
      color:${accent};font-size:18px;font-weight:700;line-height:1;
    `;
    avatar.textContent = (d.name_en || '?')[0].toUpperCase();
    card.appendChild(avatar);

    const info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0;overflow:hidden;';

    const nameNp = document.createElement('div');
    nameNp.style.cssText = `font-size:15px;font-weight:700;color:#0f172a;line-height:1.3;
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:${PDF_NODE_W - 80}px;`;
    nameNp.textContent = d.name_np || '(अज्ञात)';
    info.appendChild(nameNp);

    const nameEn = document.createElement('div');
    nameEn.style.cssText = 'font-size:12px;color:#475569;line-height:1.3;margin-top:1px;';
    nameEn.textContent = d.name_en || '(Unknown)';
    info.appendChild(nameEn);

    const spouseText = d.spouse_np || d.spouse_en;
    if (spouseText) {
      const spouse = document.createElement('div');
      spouse.style.cssText = `font-size:11px;color:#94a3b8;line-height:1.3;margin-top:2px;
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:${PDF_NODE_W - 80}px;`;
      spouse.textContent = `♥ ${spouseText}`;
      info.appendChild(spouse);
    }

    if (d.children && d.children.length > 0) {
      const cnt = document.createElement('div');
      cnt.style.cssText = `font-size:11px;color:${accent};margin-top:3px;font-weight:500;`;
      cnt.textContent = `${d.children.length} children`;
      info.appendChild(cnt);
    }

    card.appendChild(info);
    container.appendChild(card);
  }

  try {
    const canvas = await html2canvas(container, {
      scale: 1,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: totalW,
      height: totalH,
    });

    // Use JPEG at 70% quality instead of PNG to drastically reduce size
    const imgData = canvas.toDataURL('image/jpeg', 0.7);

    const isLandscape = totalW > totalH;
    const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a1');

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    pdf.setFontSize(22);
    pdf.text(title, pdfW / 2, 16, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setTextColor(120);
    pdf.text(`Generated: ${new Date().toLocaleDateString()} | ${allNodes.length} members`, pdfW / 2, 24, { align: 'center' });

    const startY = 30;
    const availW = pdfW - 20;
    const availH = pdfH - startY - 10;
    const ratio = Math.min(availW / canvas.width, availH / canvas.height);
    const finalW = canvas.width * ratio;
    const finalH = canvas.height * ratio;
    const ox = (pdfW - finalW) / 2;

    pdf.addImage(imgData, 'JPEG', ox, startY, finalW, finalH);
    pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
