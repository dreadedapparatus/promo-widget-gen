
import { Product } from '../types';
import { EXPECTED_COLUMNS } from '../constants';

declare const XLSX: any; // Using SheetJS from CDN

const LOWERCASE_EXPECTED_COLUMNS = EXPECTED_COLUMNS.map(c => c.toLowerCase());

export const processSpreadsheet = (file: File): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    if (typeof XLSX === 'undefined') {
        return reject(new Error('Spreadsheet library (SheetJS) is not loaded. Please check your network connection.'));
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let processed = false;
        
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) continue;

          const sheetDataAsArray: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
          
          let headerRowIndex = -1;
          
          for (let i = 0; i < Math.min(10, sheetDataAsArray.length); i++) {
            const row = sheetDataAsArray[i].map(h => String(h).trim().toLowerCase());
            const foundCols = LOWERCASE_EXPECTED_COLUMNS.filter(col => row.includes(col));
            
            // Allow for some missing columns, but require most of them
            if (foundCols.length >= LOWERCASE_EXPECTED_COLUMNS.length - 4) { 
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex !== -1) {
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });

            if (jsonData.length === 0) continue;

            const products: Product[] = jsonData.map((row: any) => {
              const normalizedRow: Product = {} as Product;
              for (const key in row) {
                if (Object.prototype.hasOwnProperty.call(row, key)) {
                  normalizedRow[key.trim().toLowerCase()] = row[key];
                }
              }
              return normalizedRow;
            });
            
            resolve(products);
            processed = true;
            break; 
          }
        }

        if (!processed) {
          throw new Error(`Could not find required columns on any sheet. Please ensure your file includes headers like: ${EXPECTED_COLUMNS.slice(0, 4).join(', ')}...`);
        }

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the file.'));
    };

    reader.readAsArrayBuffer(file);
  });
};
