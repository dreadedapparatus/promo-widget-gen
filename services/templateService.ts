
import { TEMPLATE_DATA } from '../constants';
import { Product } from '../types';

declare const XLSX: any; // Using SheetJS from CDN

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

function generateCsv(rows: Product[]): string {
    const cols = Array.from(rows.reduce((set, r) => {
        Object.keys(r).forEach(k => set.add(k));
        return set;
    }, new Set<string>()));

    const escape = (v: any) => {
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const header = cols.join(',');
    const body = rows.map(r => cols.map(c => escape(r[c] ?? '')).join(',')).join('\r\n');
    return `${header}\r\n${body}`;
}


export const downloadTemplate = async (type: 'xlsx' | 'csv'): Promise<void> => {
    if (type === 'csv') {
        const csv = generateCsv(TEMPLATE_DATA);
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8' });
        downloadBlob(blob, 'product_template.csv');
        return;
    }

    if (typeof XLSX === 'undefined') {
        throw new Error('Spreadsheet library (SheetJS) is not loaded.');
    }

    const ws = XLSX.utils.json_to_sheet(TEMPLATE_DATA);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    downloadBlob(blob, 'product_template.xlsx');
};
