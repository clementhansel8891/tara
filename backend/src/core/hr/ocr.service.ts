import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async extractData(fileUrl: string, documentType: string) {
    this.logger.log(`Performing OCR extraction on ${fileUrl} for type ${documentType}`);

    // Mock OCR processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulated OCR results based on document type
    if (documentType.toUpperCase() === "PASSPORT") {
      return {
        confidence: 0.95,
        fields: {
          document_number: "PP-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
          expiry_date: "2031-12-31",
          issuing_country: "IDN",
          full_name: "John Doe",
        },
        raw_text: "PASSPORT ... NAME: John Doe ... NO: PP-ABC123 ... EXP: 2031-12-31",
      };
    }

    if (documentType.toUpperCase() === "VISA") {
      return {
        confidence: 0.88,
        fields: {
          document_number: "V-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
          expiry_date: "2027-06-15",
          visa_type: "Work",
        },
        raw_text: "VISA ENTRY ... TYPE: WORK ... VALID UNTIL: 2027-06-15",
      };
    }

    return {
      confidence: 0.5,
      fields: {},
      raw_text: "Manual verification required - Unrecognized format",
      warning: "Low confidence extraction",
    };
  }
}
