import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { IPaymentRepository } from "./repositories/payment.repository.interface";
import { PaymentService } from "./payment.service";
import { TenantContext } from "../../gateway/tenant-context.interface";

@Injectable()
export class PaymentReconciliationService {
  private readonly logger = new Logger(PaymentReconciliationService.name);

  constructor(
    private readonly repository: IPaymentRepository,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Synchronize all PENDING transactions with their respective gateways.
   * Runs every 30 minutes to capture missed webhooks.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async reconcilePendingPayments() {
    this.logger.log("Starting payment reconciliation scan with exponential backoff...");

    const pendingTxs = await this.repository.findPendingTransactions();
    const now = new Date();

    for (const tx of pendingTxs) {
      if (!tx.provider || !tx.externalRef) continue;

      // HARDENED: Exponential Backoff Logic
      const retryCount = tx.retryCount || 0;
      const lastChecked = tx.lastCheckedAt;
      
      if (lastChecked && retryCount > 0) {
        const hoursToWait = Math.pow(2, Math.min(retryCount, 6)); // Max wait 64 hours
        const nextCheckAllowed = new Date(lastChecked.getTime() + hoursToWait * 60 * 60 * 1000);
        
        if (now < nextCheckAllowed) {
          continue; // Skip this check for now
        }
      }

      try {
        const adapter = this.paymentService.getAdapter(tx.provider);
        const status = await adapter.checkStatus(tx.externalRef);

        if (status.status !== "PENDING") {
          this.logger.log(
            `Transaction ${tx.id} status changed from PENDING to ${status.status}. Resetting retry count.`,
          );

          const ctx: TenantContext = {
            tenant_id: tx.tenant_id,
            company_id: tx.company_id,
            branch_id: tx.branch_id,
            ecommerce_id: tx.ecommerce_id,
          } as TenantContext;

          await this.paymentService.syncTransactionStatus(
            ctx,
            tx.id,
            {
              status: status.status as any,
              gateway_fee: status.fee,
              net_amount: status.net_amount,
              retry_count: 0, // Reset on success
              last_checked_at: now,
            },
            tx.provider,
            "reconciliation-job",
          );
        } else {
          const ctx: TenantContext = {
            tenant_id: tx.tenant_id,
            company_id: tx.company_id,
            branch_id: tx.branch_id,
            ecommerce_id: tx.ecommerce_id,
          } as TenantContext;

          // Still pending, just update last checked
          await this.repository.updateTransactionStatus(
            ctx,
            tx.id,
            { status: "PENDING", last_checked_at: now, retry_count: retryCount },
            "reconciliation-job"
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to reconcile transaction ${tx.id}: ${error.message}. Incrementing backoff.`,
        );
        
        const ctx: TenantContext = {
          tenant_id: tx.tenant_id,
          company_id: tx.company_id,
          branch_id: tx.branch_id,
          ecommerce_id: tx.ecommerce_id,
        } as TenantContext;

        // Update backoff counters
        await this.repository.updateTransactionStatus(
          ctx,
          tx.id,
          { 
            status: "PENDING", 
            retry_count: retryCount + 1, 
            last_checked_at: now 
          },
          "reconciliation-job"
        );
      }
    }

    this.logger.log("Payment reconciliation scan completed.");
  }
}
