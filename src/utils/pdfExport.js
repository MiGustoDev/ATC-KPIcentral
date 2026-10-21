import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getMetricStatus } from '../utils';

/**
 * Loads an image from a URL and converts it to a base64 Data URL.
 */
const getBase64ImageFromUrl = async (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve({ dataURL, width: canvas.width, height: canvas.height });
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
};

/**
 * Exports the operational KPI records into an executive, styled PDF report.
 */
export async function exportOperationalKPItoPDF({
  records = [],
  period = '',
  selectedCanal = 'ALL',
  selectedSup = 'ALL',
  supervisorMap = {},
  storeMap = {},
  kpiSummary = null,
  thresholds = {}
}) {
  if (!records || records.length === 0) {
    alert('No hay registros para exportar con los filtros seleccionados.');
    return;
  }

  // Create document in Landscape mode for optimal 9-column display
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36; // 0.5 inch

  // 1. Try to load logo
  const logoInfo = await getBase64ImageFromUrl('/Logo_Mi_Gusto_2025.png');

  // Top header background banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 74, 'F');

  // Gold accent bottom line
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 72, pageWidth, 2.5, 'F');

  // Logo or title positioning
  let titleX = margin;
  if (logoInfo?.dataURL) {
    const logoRatio = logoInfo.width / logoInfo.height;
    const targetHeight = 36;
    const targetWidth = targetHeight * logoRatio;
    doc.addImage(logoInfo.dataURL, 'PNG', margin, 18, targetWidth, targetHeight);
    titleX = margin + targetWidth + 16;
  }

  // Document Title & Tagline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('KPI Central Operativo - Apps & Delivery', titleX, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Monitoreo de Calidad y Rendimiento Operativo (PedidosYa, Rappi, Mercado Delivery)', titleX, 52);

  // Generation timestamp on top right
  const now = new Date();
  const formattedDate = now.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(245, 158, 11);
  doc.text(`Generado: ${formattedDate} ${formattedTime} hs`, pageWidth - margin, 32, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Total Sucursales en Reporte: ${records.length}`, pageWidth - margin, 46, { align: 'right' });

  // 2. Filter Summary Info Strip (Metadata card)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, 84, pageWidth - (margin * 2), 38, 4, 4, 'FD');

  const canalLabel = selectedCanal === 'ALL' ? 'Todos los Canales' : selectedCanal;
  const supLabel = selectedSup === 'ALL' ? 'Todas las Supervisoras' : (supervisorMap[selectedSup]?.name || selectedSup);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59); // slate-800

  // Column 1: Período
  doc.text('PERÍODO:', margin + 14, 101);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(period || 'No especificado', margin + 62, 101);

  // Column 2: Canal
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('CANAL:', margin + 190, 101);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(canalLabel, margin + 232, 101);

  // Column 3: Supervisora
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('SUPERVISORA:', margin + 355, 101);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(supLabel, margin + 432, 101);

  // Column 4: Totales ejecutivos si existen
  if (kpiSummary) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const summaryText = `Órdenes: ${kpiSummary.totalOrders.toLocaleString('es-AR')}  |  Canc: ${kpiSummary.cancPct.toFixed(1)}%  |  Recl: ${kpiSummary.recPct.toFixed(1)}%  |  Disp: ${kpiSummary.dispAvg.toFixed(1)}%`;
    doc.text(summaryText, pageWidth - margin - 14, 101, { align: 'right' });
  }

  // 3. Grid Table Data preparation
  const tableHeaders = [
    'CANAL',
    'SUCURSAL',
    'SUPERVISORA',
    'ÓRDENES',
    'CANC. %',
    'RECL. %',
    'RECL. $',
    'DEMORAS %',
    'DISP. %'
  ];

  const tableRows = records.map((r) => {
    const supId = storeMap[r.tienda.toLowerCase()];
    const supName = supervisorMap[supId]?.name || 'Sin Asignar';
    return [
      r.canal,
      r.tienda,
      supName,
      (r.confirmadas || 0).toLocaleString('es-AR'),
      `${Number(r.cancelacionesPct || 0).toFixed(2)}%`,
      `${Number(r.reclamosPct || 0).toFixed(2)}%`,
      `$ ${Math.round(r.reclamosCosto || 0).toLocaleString('es-AR')}`,
      `${Number(r.demorasPct || 0).toFixed(2)}%`,
      `${Number(r.disponibilidad || 0).toFixed(2)}%`
    ];
  });

  // 4. Generate AutoTable with sleek styling
  autoTable(doc, {
    startY: 130,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    margin: { left: margin, right: margin, bottom: 40 },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      textColor: [30, 41, 59], // slate-800
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 5.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: {
      0: { cellWidth: 78, fontStyle: 'bold' }, // Canal
      1: { cellWidth: 135, fontStyle: 'bold' }, // Sucursal
      2: { cellWidth: 120 }, // Supervisora
      3: { cellWidth: 68, halign: 'right', fontStyle: 'bold' }, // Órdenes
      4: { cellWidth: 65, halign: 'right' }, // Canc. %
      5: { cellWidth: 65, halign: 'right' }, // Recl. %
      6: { cellWidth: 78, halign: 'right' }, // Recl. $
      7: { cellWidth: 75, halign: 'right' }, // Demoras %
      8: { cellWidth: 75, halign: 'right' } // Disp. %
    },
    didParseCell: (data) => {
      // Right-align numeric header cells to match content
      if (data.section === 'head' && data.column.index >= 3) {
        data.cell.styles.halign = 'right';
      }

      if (data.section === 'body') {
        const rawRecord = records[data.row.index];
        if (!rawRecord) return;

        // Canal badge color
        if (data.column.index === 0) {
          if (rawRecord.canal === 'PedidosYa') {
            data.cell.styles.textColor = [225, 29, 72]; // rose-600
          } else if (rawRecord.canal === 'Rappi') {
            data.cell.styles.textColor = [234, 88, 12]; // orange-600
          } else if (rawRecord.canal === 'Mercado Delivery') {
            data.cell.styles.textColor = [16, 149, 106]; // emerald-600
          }
        }

        // Highlight critical metrics in rose
        if (thresholds) {
          if (data.column.index === 4 && getMetricStatus('cancelacionesPct', rawRecord.cancelacionesPct, thresholds) === 'danger') {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.column.index === 5 && getMetricStatus('reclamosPct', rawRecord.reclamosPct, thresholds) === 'danger') {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.column.index === 7 && getMetricStatus('demorasPct', rawRecord.demorasPct, thresholds) === 'danger') {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.column.index === 8 && getMetricStatus('disponibilidad', rawRecord.disponibilidad, thresholds) === 'danger') {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
    didDrawPage: () => {
      // Footer divider line
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 26, pageWidth - margin, pageHeight - 26);

      // Left footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Mi Gusto - Departamento de Sistemas | Monitoreo Operativo ATC',
        margin,
        pageHeight - 14
      );
    }
  });

  // Re-calculate total pages and print "Página X de Y" on each page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 14, { align: 'right' });
  }

  // 5. Download the PDF
  const safePeriod = (period || 'General').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeCanal = selectedCanal !== 'ALL' ? selectedCanal.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Todos_Canales';
  const fileName = `Reporte_KPI_${safePeriod}_${safeCanal}.pdf`;

  doc.save(fileName);
}
