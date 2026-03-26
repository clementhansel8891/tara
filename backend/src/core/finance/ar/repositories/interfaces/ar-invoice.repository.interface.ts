import { IArInvoice, IArInvoiceLine } from '../../domain/ar.interfaces';
import { Prisma } from '@prisma/client';

export interface IArInvoiceRepository {
  findById(tenantId: string, companyId: string, id: string): Promise<IArInvoice | null>;
  findByNumber(tenantId: string, companyId: string, invoiceNumber: string): Promise<IArInvoice | null>;
  findByIdempotencyKey(tenantId: string, companyId: string, key: string): Promise<IArInvoice | null>;
  findAll(tenantId: string, companyId: string, customerId?: string): Promise<IArInvoice[]>;
  create(tenantId: string, companyId: string, data: any): Promise<IArInvoice>;
  createLines(tenantId: string, companyId: string, invoiceId: string, lines: any[]): Promise<IArInvoiceLine[]>;
  updateStatus(tenantId: string, companyId: string, id: string, status: string, outstandingAmount?: Prisma.Decimal, tx?: Prisma.TransactionClient): Promise<IArInvoice>;
  getLines(tenantId: string, companyId: string, invoiceId: string): Promise<IArInvoiceLine[]>;
}
