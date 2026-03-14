import { Injectable, Logger } from "@nestjs/common";
import { IHRRepository } from "./repositories/hr.repository.interface";
import { UploadComplianceDocumentDto } from "./dto/upload-compliance-document.dto";
import { EventBusService } from "../../shared/events/event-bus.service";
import { OcrService } from "./ocr.service";

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private readonly repository: IHRRepository,
    private readonly eventBus: EventBusService,
    private readonly ocrService: OcrService,
  ) {}

  async uploadDocument(tenantId: string, dto: UploadComplianceDocumentDto, userId: string) {
    this.logger.log(`Uploading compliance document for employee ${dto.employeeId}`);

    const doc = await this.repository.uploadComplianceDocument(tenantId, dto);

    await this.eventBus.publish({
      eventType: "compliance.document_uploaded",
      tenantId,
      entityId: doc.id,
      userId,
      payload: {
        employeeId: doc.employeeId,
        documentType: doc.documentType,
      },
    });

    return doc;
  }

  async uploadAndClassify(tenantId: string, employeeId: string, fileData: any) {
    this.logger.log(`Uploading and auto-classifying document for employee ${employeeId}`);

    const ocrResult = await this.ocrService.extractData(fileData.fileUrl, fileData.documentType || "UNKNOWN");
    
    const doc = await this.repository.uploadComplianceDocument(tenantId, {
      employeeId,
      documentType: fileData.documentType || "OTHER",
      documentNumber: ocrResult.fields.document_number || `SIM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      fileUrl: fileData.fileUrl,
      expiryDate: ocrResult.fields.expiry_date ? new Date(ocrResult.fields.expiry_date) : null,
      metadata: {
        ocrConfidence: ocrResult.confidence,
        ocrExtracted: ocrResult.fields,
        autoClassified: true,
      },
    });

    // Cache in employee metadata
    const employee = await this.repository.getEmployeeById(tenantId, employeeId);
    if (employee) {
      const currentMetadata = (employee as any).documentsMetadata || {};
      await this.repository.updateEmployee(tenantId, employeeId, {
        documentsMetadata: {
          ...currentMetadata,
          [doc.documentType]: {
            lastVerifiedAt: new Date(),
            ocrConfidence: ocrResult.confidence,
            status: "AUTO_CLASSIFIED",
          }
        }
      });
    }

    return doc;
  }

  async verifyDocument(tenantId: string, id: string, verifiedBy: string, status: string) {
    this.logger.log(`Verifying compliance document ${id} with status ${status}`);

    const doc = await this.repository.verifyDocument(tenantId, id, verifiedBy, status);

    await this.eventBus.publish({
      eventType: "compliance.document_verified",
      tenantId,
      entityId: doc.id,
      userId: verifiedBy,
      payload: {
        employeeId: doc.employeeId,
        status: doc.verificationStatus,
      },
    });

    return doc;
  }

  async checkExpirations(tenantId: string) {
    const documents = await this.repository.getGlobalComplianceStatus(tenantId);
    const now = new Date();
    const expiredDocs = documents.filter(
      (d: any) => d.expiryDate && new Date(d.expiryDate) < now && d.verificationStatus !== "EXPIRED",
    );

    for (const doc of expiredDocs) {
      this.logger.warn(`Document ${doc.id} for employee ${doc.employeeId} has expired`);
      await this.repository.verifyDocument(tenantId, doc.id, "SYSTEM", "EXPIRED");
      
      await this.eventBus.publish({
        eventType: "compliance.document_expired",
        tenantId,
        entityId: doc.id,
        userId: "SYSTEM",
        payload: {
          employeeId: doc.employeeId,
          documentType: doc.documentType,
        },
      });
    }

    return expiredDocs.length;
  }

  async auditCompliance(tenantId: string) {
    this.logger.log(`Running global compliance audit for tenant ${tenantId}`);

    const allDocs = await this.repository.getGlobalComplianceStatus(tenantId);
    const now = new Date();
    
    const auditResults = {
      totalDocuments: allDocs.length,
      expired: 0,
      expiringSoon: 0, // next 30 days
      pendingVerification: 0,
      criticalAlerts: [],
    };

    for (const doc of allDocs) {
      if (doc.verificationStatus === 'PENDING') {
        auditResults.pendingVerification++;
      }

      if (doc.expiryDate) {
        const expiry = new Date(doc.expiryDate);
        const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysToExpiry <= 0) {
          auditResults.expired++;
          (auditResults.criticalAlerts as any[]).push({
            id: doc.id,
            employeeId: doc.employeeId,
            type: doc.documentType,
            issue: 'EXPIRED',
          });
        } else if (daysToExpiry <= 30) {
          auditResults.expiringSoon++;
        }
      }
    }

    return auditResults;
  }

  async triggerOcr(tenantId: string, documentId: string, userId: string) {
    this.logger.log(`Triggering OCR for document ${documentId}`);

    const docs = await this.repository.getGlobalComplianceStatus(tenantId);
    const doc = docs.find((d: any) => d.id === documentId);
    if (!doc) throw new Error("Document not found");

    const ocrResult = await this.ocrService.extractData(doc.fileUrl, doc.documentType);

    // Update document with OCR results in metadata
    const updated = await this.repository.verifyDocument(tenantId, documentId, "OCR_ENGINE", doc.verificationStatus, {
      ...((doc as any).metadata || {}),
      ocr_extraction: ocrResult,
    });

    await this.eventBus.publish({
      eventType: "compliance.ocr_completed",
      tenantId,
      entityId: doc.id,
      userId,
      payload: {
        confidence: ocrResult.confidence,
        extractedFields: ocrResult.fields,
      },
    });

    // Cache results in employee document metadata
    const employee = await this.repository.getEmployeeById(tenantId, doc.employeeId);
    if (employee) {
      const currentMetadata = (employee as any).documentsMetadata || {};
      await this.repository.updateEmployee(tenantId, doc.employeeId, {
        documentsMetadata: {
          ...currentMetadata,
          [doc.documentType]: {
            lastOcrAt: new Date(),
            ocrConfidence: ocrResult.confidence,
            fields: ocrResult.fields,
          }
        }
      });
    }

    return updated;
  }
}
