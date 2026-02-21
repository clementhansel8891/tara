import { Injectable } from '@nestjs/common';
import csv from 'csv-parser';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class FileProcessingService {
  /**
   * Sanitizes a value to prevent CSV/Excel injection.
   * Strips prefix characters: =, +, -, @
   */
  private sanitizeValue(value: any): any {
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(value)) {
      return `'${value}`; // Prepend single quote as per Excel security best practices
    }
    return value;
  }

  /**
   * Parses a CSV buffer into an array of DTO instances and validates them.
   */
  async parseCsv<T>(buffer: Buffer, dtoClass: new () => T): Promise<{ data: T[]; errors: any[] }> {
    const results: any[] = [];
    const stream = Readable.from(buffer as any);

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => {
          // Sanitize incoming data
          const sanitized: any = {};
          for (const key in data) {
            sanitized[key] = this.sanitizeValue(data[key]);
          }
          results.push(sanitized);
        })
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    });

    return this.validateData(results, dtoClass);
  }

  /**
   * Parses an Excel buffer into an array of DTO instances and validates them.
   */
  async parseExcel<T>(buffer: Buffer, dtoClass: new () => T): Promise<{ data: T[]; errors: any[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.getWorksheet(1);
    const results: any[] = [];

    if (!worksheet) {
      return { data: [], errors: [{ message: 'No worksheet found' }] };
    }

    const headers: string[] = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value?.toString() || '';
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip headers
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          rowData[header] = this.sanitizeValue(cell.value);
        }
      });
      results.push(rowData);
    });

    return this.validateData(results, dtoClass);
  }

  /**
   * Generates a CSV string from data.
   */
  async generateCsv(data: any[]): Promise<string> {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => 
      headers.map(header => JSON.stringify(this.sanitizeValue(obj[header]) ?? '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Generates an Excel buffer from data with forensic marks and watermarks.
   */
  async generateExcel(
    data: any[], 
    columns: { header: string; key: string; width?: number }[],
    options?: {
      traceId?: string,
      watermark?: {
        text: string;
        opacity?: number;
        position?: { x: number, y: number }; // cell location etc
      }
    }
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Zenvix Export');
    
    // 1. Forensic Traceability (Hidden)
    if (options?.traceId) {
      workbook.creator = 'Zenvix System';
      workbook.lastModifiedBy = 'Zenvix System';
      // Fallback: Embed trace info in a hidden sheet since custom properties types are tricky
      const hiddenSheet = workbook.addWorksheet('_system_meta', { state: 'veryHidden' });
      hiddenSheet.getCell('A1').value = 'Zenvix-Trace-ID';
      hiddenSheet.getCell('B1').value = options.traceId;
      hiddenSheet.getCell('A2').value = 'Export-Timestamp';
      hiddenSheet.getCell('B2').value = new Date().toISOString();

      // Hidden System Mark at Z999
      const forensicCell = worksheet.getCell('Z999');
      forensicCell.value = `TRACE:${options.traceId}`;
      forensicCell.font = { color: { argb: 'FFFFFFFF' }, size: 2 }; // Invisible font
      forensicCell.protection = { locked: true };
    }

    // 2. Visible Watermark
    if (options?.watermark?.text) {
      const wmText = options.watermark.text;
      const posX = options.watermark.position?.x || 1;
      const posY = options.watermark.position?.y || 1;

      // ExcelJS doesn't support floating text boxes easily, we use a formatted cell or background
      // For drag & drop flexibility in Excel, we can use a "Note" or a specific cell styling
      const wmCell = worksheet.getCell(posY, posX);
      wmCell.value = wmText;
      wmCell.font = { 
        size: 72, 
        bold: true, 
        color: { argb: '20808080' } // Low opacity gray
      };
      wmCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    worksheet.columns = columns;
    worksheet.addRows(data.map(row => {
      const sanitized: any = {};
      for (const key in row) {
        sanitized[key] = this.sanitizeValue(row[key]);
      }
      return sanitized;
    }));

    // Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    return (await workbook.xlsx.writeBuffer()) as any;
  }

  private async validateData<T>(rawResults: any[], dtoClass: new () => T): Promise<{ data: T[]; errors: any[] }> {
    const validData: T[] = [];
    const allErrors: any[] = [];

    for (let i = 0; i < rawResults.length; i++) {
      const instance = plainToInstance(dtoClass, rawResults[i]);
      const errors = await validate(instance as any);
      
      if (errors.length > 0) {
        allErrors.push({ row: i + 2, errors: errors.map(e => ({ property: e.property, constraints: e.constraints })) });
      } else {
        validData.push(instance);
      }
    }

    return { data: validData, errors: allErrors };
  }
}
