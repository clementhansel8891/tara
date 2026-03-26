import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { IArCreditMemoRepository } from '../repositories/interfaces/ar-credit-memo.repository.interface';
import { LedgerPostingService } from '../../services/ledger-posting.service';
import { FiscalPeriodService } from '../../services/fiscal-period.service';
import { IArCreditMemo } from '../domain/ar.interfaces';
import { AR_EVENT_TYPES } from '../domain/ar.constants';

@Injectable()
export class ArCreditMemoService {
  constructor(
    @Inject('IArCreditMemoRepository')
    private readonly creditMemoRepo: IArCreditMemoRepository,
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly fiscalPeriodService: FiscalPeriodService,
  ) {}

  async issueCreditMemo(tenantId: string, companyId: string, data: any): Promise<IArCreditMemo> {
    // Audit check
    await this.fiscalPeriodService.validatePeriodOpenForPosting(tenantId, companyId, 'FISCAL_AUTO', 'SYS_USER');

    const creditMemo = await this.creditMemoRepo.create(tenantId, companyId, data);

    // Enqueue for Ledger
    await this.ledgerPostingService.enqueuePosting(
      tenantId,
      companyId,
      AR_EVENT_TYPES.CREDIT_MEMO_ISSUED,
      `ar-cm-${creditMemo.id}`,
      {
        creditMemoId: creditMemo.id,
        amount: creditMemo.creditAmount,
        customerId: creditMemo.customerId,
        branchId: 'BRANCH_AUTO',
        locationId: 'LOC_AUTO',
        fiscalPeriodId: 'FISCAL_AUTO',
      }
    );

    return creditMemo;
  }
}
