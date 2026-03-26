import { Injectable, Logger } from '@nestjs/common';
import { APVendorBill, APVendorPayment } from '../domain/ap.interfaces';
import { PostingGatewayService } from './posting-gateway.service';
import { AccountingMappingService } from './accounting-mapping.service';
import { SubledgerEntryType } from '../entities/finance-subledger.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class APAllocationService {
  private readonly logger = new Logger(APAllocationService.name);

  constructor(
    private readonly gateway: PostingGatewayService,
    private readonly mappingService: AccountingMappingService,
  ) {}

  /**
   * Matches a vendor payment to specific bills.
   * Standardized Lifecycle: PENDING -> VALIDATED -> POSTING -> POSTED
   */
  async allocate(payment: APVendorPayment, bill: APVendorBill, amount: number): Promise<void> {
    if (amount > bill.balanceDue) throw new Error('Allocation exceeds bill balance.');

    this.logger.log(`Allocating ${amount} to Bill ${bill.billNumber} from Payment ${payment.paymentNumber}`);

    // 1. Resolve Accounting Mapping
    const mapping = await this.mappingService.resolveAccounts(
        payment.tenantId,
        payment.companyId,
        SubledgerEntryType.AP_ALLOCATION,
        'ALLOCATION'
    );

    const postingRequestId = uuid();

    // 2. Update balances locally
    bill.balanceDue -= amount;

    // 3. Trigger Financial Posting (POSTING)
    const postingRequest = {
        requestId: postingRequestId,
        tenantId: payment.tenantId,
        companyId: payment.companyId,
        sourceModule: 'ACCOUNTS_PAYABLE',
        sourceEventId: `ALC-${payment.id}-${bill.id}`,
        eventType: SubledgerEntryType.AP_ALLOCATION,
        payload: {
          paymentId: payment.id,
          billId: bill.id,
          amount,
          currency: payment.currency,
          debitAccountId: mapping.debitAccountId,
          creditAccountId: mapping.creditAccountId,
          fiscalPeriodId: 'SYS_AUTO',
        },
        createdAt: new Date(),
    };

    const result = await this.gateway.postEvent(postingRequest as any);
    
    if (result.status === 'POSTED') {
        this.logger.log(`AP Allocation successfully posted.`);
    }
  }
}
