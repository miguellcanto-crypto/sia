export function exportToCsv(filename: string, rows: any[]) {
    if (!rows || !rows.length) return;

    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
        keys.join(separator) +
        '\n' +
        rows.map(row => {
            return keys.map(k => {
                let cell = row[k] === null || row[k] === undefined ? '' : row[k];
                cell = cell instanceof Date
                    ? cell.toLocaleString()
                    : typeof cell === 'string'
                        ? cell.replace(/"/g, '""')
                        : cell;
                if (typeof cell === 'string') cell = `"${cell}"`;
                return cell;
            }).join(separator);
        }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ColumnDef {
    header: string;
    dataKey: string;
    format?: (value: any) => string;
}

export function exportToCSVTyped(
    data: any[],
    columns: ColumnDef[],
    filename: string
) {
    if (!data || data.length === 0) return;

    const headers = columns.map(c => c.header);
    const rows = data.map(row => 
        columns.map(col => {
            let val = row[col.dataKey];
            if (col.format) val = col.format(val);
            return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
    );

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportToPDF(
    data: any[],
    columns: ColumnDef[],
    title: string,
    filename: string,
    subtitle?: string
) {
    if (!data || data.length === 0) return;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
    });

    const headers = columns.map(col => col.header);
    const rows = data.map(row => 
        columns.map(col => {
            let val = row[col.dataKey];
            if (col.format) val = col.format(val);
            return String(val ?? '');
        })
    );

    doc.setFontSize(18);
    doc.text(title, 40, 40);

    if (subtitle) {
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(subtitle, 40, 60);
    }

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Generado el: ${format(new Date(), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}`, 40, subtitle ? 80 : 60);

    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: subtitle ? 100 : 80,
        theme: 'grid',
        headStyles: { 
            fillColor: [37, 99, 235], // blue-600
            textColor: 255, 
            fontSize: 10,
            halign: 'center'
        },
        styles: { 
            fontSize: 9, 
            cellPadding: 4 
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // slate-50
        }
    });

    doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
