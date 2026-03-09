import { Injectable } from "@nestjs/common";

export interface LabelData {
  name: string;
  sku: string;
  barcode: string;
  price: number;
  unit: string;
}

@Injectable()
export class LabelTemplateService {
  /**
   * Generates a clean HTML/CSS fragment for a barcode label.
   * Optimized for 50x30mm thermal labels.
   */
  generateLabelHtml(data: LabelData): string {
    return `
      <div style="
        width: 50mm;
        height: 30mm;
        padding: 2mm;
        font-family: 'Inter', system-ui, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        background: white;
        color: black;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="width: 100%; text-align: center;">
          <div style="font-size: 8pt; font-weight: 900; line-height: 1; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${data.name}
          </div>
          <div style="font-size: 6pt; font-weight: 700; color: #444; margin-top: 1mm;">
            SKU: ${data.sku}
          </div>
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
          <!-- Barcode Visualization (Mock) -->
          <div style="width: 90%; height: 8mm; background: linear-gradient(90deg, #000 5%, transparent 5%, transparent 10%, #000 10%, #000 15%, transparent 15%, transparent 25%, #000 25%, #000 40%, transparent 40%, transparent 45%, #000 45%, #000 50%, transparent 50%, transparent 60%, #000 60%, #000 75%, transparent 75%, transparent 80%, #000 80%);"></div>
          <div style="font-family: monospace; font-size: 6pt; margin-top: 0.5mm; font-weight: bold;">
            ${data.barcode}
          </div>
        </div>

        <div style="width: 100%; display: flex; justify-content: center; align-items: baseline; gap: 1mm;">
          <span style="font-size: 10pt; font-weight: 900; letter-spacing: -0.5px;">$${data.price.toFixed(2)}</span>
          <span style="font-size: 6pt; font-weight: 700; color: #666; text-transform: uppercase;">/ ${data.unit}</span>
        </div>
      </div>
    `.trim();
  }

  /**
   * Generates ZPL (Zebra Programming Language) for direct thermal printing.
   * This is a standard for professional label printers.
   */
  generateZPL(data: LabelData): string {
    return `
^XA
^CI28
^PW400
^LL240
^FO20,20^A0N,25,25^FB360,1,0,C^FD${data.name}^FS
^FO20,50^A0N,20,20^FB360,1,0,C^FDSKU: ${data.sku}^FS
^BY2,3,60^FO50,80^BCN,60,Y,N,N^FD${data.barcode}^FS
^FO20,180^A0N,35,35^FB360,1,0,C^FD$${data.price.toFixed(2)} / ${data.unit}^FS
^XZ
    `.trim();
  }
}
