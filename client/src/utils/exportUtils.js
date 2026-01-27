/**
 * Export Utilities - Exportar datos a PDF, Excel y CSV
 */

// Exportar a CSV
export function exportToCSV(data, filename = 'reporte') {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar');
    return false;
  }

  try {
    // Obtener headers de las keys del primer objeto
    const headers = Object.keys(data[0]);
    
    // Crear filas CSV
    const csvRows = [];
    
    // Header row
    csvRows.push(headers.join(','));
    
    // Data rows
    for (const row of data) {
      const values = headers.map(header => {
        let value = row[header];
        
        // Escapar comillas y valores con comas
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`;
        } else if (typeof value === 'object') {
          value = `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        
        return value;
      });
      csvRows.push(values.join(','));
    }
    
    // Crear blob y descargar
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}_${getDateStamp()}.csv`);
    
    return true;
  } catch (error) {
    console.error('Error exportando CSV:', error);
    return false;
  }
}

// Exportar a JSON
export function exportToJSON(data, filename = 'reporte') {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    downloadBlob(blob, `${filename}_${getDateStamp()}.json`);
    return true;
  } catch (error) {
    console.error('Error exportando JSON:', error);
    return false;
  }
}

// Exportar a Excel (formato simple sin librería externa)
export function exportToExcel(data, filename = 'reporte', sheetName = 'Datos') {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar');
    return false;
  }

  try {
    const headers = Object.keys(data[0]);
    
    // Crear tabla HTML para Excel
    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${sheetName}</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; }
          th { background-color: #4a5568; color: white; font-weight: bold; padding: 8px; border: 1px solid #000; }
          td { padding: 6px; border: 1px solid #ddd; }
          .number { mso-number-format:"\\@"; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${escapeHtml(formatHeader(h))}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;
    
    for (const row of data) {
      tableHtml += '<tr>';
      for (const header of headers) {
        let value = row[header];
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        tableHtml += `<td>${escapeHtml(String(value))}</td>`;
      }
      tableHtml += '</tr>';
    }
    
    tableHtml += `
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    downloadBlob(blob, `${filename}_${getDateStamp()}.xls`);
    
    return true;
  } catch (error) {
    console.error('Error exportando Excel:', error);
    return false;
  }
}

// Generar PDF simple (formato imprimible)
export function generatePrintablePDF(title, content, data = null) {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Por favor, permite ventanas emergentes para generar el PDF');
    return false;
  }

  let tableHtml = '';
  
  if (data && data.length > 0) {
    const headers = Object.keys(data[0]);
    tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            ${headers.map(h => `<th>${formatHeader(h)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          max-width: 1000px;
          margin: 0 auto;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #6c5ce7;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: 700;
          color: #6c5ce7;
        }
        .date {
          color: #666;
          font-size: 14px;
        }
        h1 {
          color: #1a1a2e;
          margin: 0 0 10px;
          font-size: 28px;
        }
        .subtitle {
          color: #666;
          margin: 0;
        }
        .content {
          margin: 30px 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-box {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #6c5ce7;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-top: 5px;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .data-table th {
          background: #6c5ce7;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 13px;
        }
        .data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }
        .data-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">💈 NEURIAX</div>
          <h1>${title}</h1>
          <p class="subtitle">Reporte generado automáticamente</p>
        </div>
        <div class="date">
          ${new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>
      
      <div class="content">
        ${content}
        ${tableHtml}
      </div>
      
      <div class="footer">
        <p>NEURIAX Salon Manager - Sistema de Gestión Profesional</p>
        <p>Este documento es un reporte generado automáticamente.</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
  return true;
}

// Utilidades
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatHeader(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

const exportUtils = {
  exportToCSV,
  exportToJSON,
  exportToExcel,
  generatePrintablePDF
};

export default exportUtils;
