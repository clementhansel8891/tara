export class ComplianceDocument {
  id: string;
  tenantId: string;
  employeeId: string;
  documentType: string;
  documentNumber?: string;
  fileUrl: string;
  expiryDate?: Date;
  verificationStatus: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}
