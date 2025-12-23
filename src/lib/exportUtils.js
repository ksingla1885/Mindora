import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Export data to CSV format
export const exportToCSV = (data, filename = 'export') => {
  if (!data || !data.length) return;
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  // Add rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Handle nested objects and arrays
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvContent += values.join(',') + '\n';
  });
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export data to PDF
export const exportToPDF = (title, data, columns, filename = 'export') => {
  if (!data || !data.length) return;
  
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  
  // Prepare data for the table
  const tableData = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    })
  );
  
  // Define table headers
  const headers = columns.map(col => ({
    title: col.label || col.key,
    dataKey: col.key
  }));
  
  // Add table to PDF
  doc.autoTable({
    head: [headers.map(h => h.title)],
    body: tableData,
    startY: 30,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 30 }
  });
  
  // Save the PDF
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Format data for heatmap visualization
export const prepareHeatmapData = (data, xField, yField, valueField) => {
  const xValues = [...new Set(data.map(item => item[xField]))];
  const yValues = [...new Set(data.map(item => item[yField]))];
  
  const result = [];
  
  yValues.forEach(y => {
    const row = { [yField]: y };
    xValues.forEach(x => {
      const item = data.find(d => d[xField] === x && d[yField] === y);
      row[x] = item ? item[valueField] : 0;
    });
    result.push(row);
  });
  
  return {
    data: result,
    xValues,
    yValues
  };
};
