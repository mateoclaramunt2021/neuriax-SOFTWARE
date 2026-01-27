/**
 * Export Data Component
 * Exporta datos a CSV, Excel, PDF
 */

import React, { useState } from 'react';

const ExportData = ({ data, filename = 'export', formats = ['csv', 'excel', 'pdf'] }) => {
  const [isExporting, setIsExporting] = useState(false);

  // CSV Export
  const exportCSV = async () => {
    setIsExporting(true);
    try {
      if (!Array.isArray(data) || data.length === 0) {
        alert('No hay datos para exportar');
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              // Escape quotes y commas
              const escaped = String(value || '')
                .replace(/"/g, '""')
                .replace(/,/g, '');
              return `"${escaped}"`;
            })
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  // Excel Export (usando SheetJS si disponible, sino CSV)
  const exportExcel = async () => {
    setIsExporting(true);
    try {
      // Si SheetJS no está disponible, hacer fallback a CSV
      if (typeof XLSX === 'undefined') {
        console.warn('SheetJS no disponible, exportando como CSV');
        exportCSV();
        return;
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  // PDF Export (usando jsPDF si disponible)
  const exportPDF = async () => {
    setIsExporting(true);
    try {
      if (typeof jsPDF === 'undefined' || typeof autoTable === 'undefined') {
        alert('PDF export no disponible. Por favor, contacte al administrador.');
        return;
      }

      const { jsPDF: PDFConstructor } = window;
      const doc = new PDFConstructor();

      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        const rows = data.map((item) =>
          headers.map((header) => item[header] || '')
        );

        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: 10,
          margin: 10,
          theme: 'grid',
        });
      }

      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = (format) => {
    switch (format) {
      case 'csv':
        exportCSV();
        break;
      case 'excel':
        exportExcel();
        break;
      case 'pdf':
        exportPDF();
        break;
      default:
        break;
    }
  };

  return (
    <div className="export-data-menu">
      {formats.includes('csv') && (
        <button
          className="export-btn export-csv"
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          title="Exportar como CSV"
        >
          📊 CSV
        </button>
      )}

      {formats.includes('excel') && (
        <button
          className="export-btn export-excel"
          onClick={() => handleExport('excel')}
          disabled={isExporting}
          title="Exportar como Excel"
        >
          📈 Excel
        </button>
      )}

      {formats.includes('pdf') && (
        <button
          className="export-btn export-pdf"
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          title="Exportar como PDF"
        >
          📄 PDF
        </button>
      )}
    </div>
  );
};

export default ExportData;

/**
 * Hook para usar exportData
 */
export const useExport = () => {
  const exportToCSV = (data, filename = 'export') => {
    if (!Array.isArray(data) || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            const escaped = String(value || '')
              .replace(/"/g, '""')
              .replace(/,/g, '');
            return `"${escaped}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return { exportToCSV };
};
