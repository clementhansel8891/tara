import type { NextApiRequest, NextApiResponse } from "next";
import { financeService } from "@/core/services/finance/financeService";
import { payrollService } from "@/core/services/finance/payrollService";
import { treasuryService } from "@/core/services/finance/treasuryService";
import { DEV_SESSION } from "@/core/security/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { action } = req.query;
  const { payload, session: clientSession } = req.body;
  
  // Use DEV_SESSION as default for mock mode
  const userSession = clientSession || DEV_SESSION;

  try {
    let result;
    switch (action) {
      // Assets & Capex
      case 'listAssets':
        result = await financeService.listAssets(userSession.tenantId, userSession);
        break;
      case 'listCapexRequests':
        result = await financeService.listCapexRequests(userSession.tenantId);
        break;
      case 'listCapexBudgets':
        result = await financeService.listCapexBudgets(userSession.tenantId);
        break;
      case 'setCapexBudget':
        result = await financeService.setCapexBudget(userSession.tenantId, userSession, payload);
        break;
      case 'createCapexRequest':
        result = await financeService.createCapexRequest(userSession.tenantId, userSession, payload);
        break;
      case 'approveCapexRequest':
        result = await financeService.approveCapexRequest(userSession.tenantId, userSession, payload.requestId);
        break;
      case 'rejectCapexRequest':
        result = await financeService.rejectCapexRequest(userSession.tenantId, userSession, payload.requestId, payload.reason);
        break;
      case 'capitalizeAsset':
        result = await financeService.capitalizeAsset(userSession.tenantId, userSession, payload.assetId, payload.capitalizationDate);
        break;
      case 'listAssetDepreciationEntries':
        result = await financeService.listAssetDepreciationEntries(userSession.tenantId, payload.assetId);
        break;
      case 'runScheduledPeriodDepreciation':
        result = await financeService.runScheduledPeriodDepreciation(userSession.tenantId, userSession, payload);
        break;
      case 'postDepreciation':
        result = await financeService.postDepreciation(userSession.tenantId, userSession, payload);
        break;
      case 'recordAssetImpairment':
        result = await financeService.recordAssetImpairment(userSession.tenantId, userSession, payload);
        break;
      case 'recordAssetRevaluation':
        result = await financeService.recordAssetRevaluation(userSession.tenantId, userSession, payload);
        break;
      case 'disposeAsset':
        result = await financeService.disposeAsset(userSession.tenantId, userSession, payload);
        break;
      case 'listAssetEvents':
        result = await financeService.listAssetEvents(userSession.tenantId, payload.assetId);
        break;
      case 'updateAssetStatus':
        result = await financeService.updateAssetStatus(userSession.tenantId, userSession, payload.id, payload.status);
        break;
      case 'generateAssetAuditPack':
        result = financeService.generateAssetAuditPack(userSession.tenantId, payload.assetId);
        break;

      // Receivables
      case 'listReceivables':
        result = financeService.listReceivables(userSession.tenantId);
        break;
      case 'createReceivable':
        result = financeService.createReceivable(userSession.tenantId, userSession, payload);
        break;
      case 'markReceived':
        result = financeService.markReceived(userSession.tenantId, payload.id);
        break;
      case 'sendReceivableReminder':
        result = financeService.sendReceivableReminder(userSession.tenantId, userSession, payload.id);
        break;

      // Payables
      case 'listPayables':
        result = financeService.listPayables(userSession.tenantId);
        break;
      case 'createPayable':
        result = financeService.createPayable(userSession.tenantId, userSession, payload);
        break;
      case 'approvePayable':
        result = financeService.approvePayable(userSession.tenantId, userSession, payload.id);
        break;
      case 'markPaid':
        result = financeService.markPaid(userSession.tenantId, payload.id);
        break;
      
      // Invoices (Aggregated)
      case 'listInvoices':
        result = financeService.listInvoices(userSession.tenantId);
        break;
      case 'captureInvoice':
        result = financeService.captureInvoice(userSession.tenantId, payload);
        break;
      case 'capturePayableInvoice':
        result = financeService.capturePayableInvoice(userSession.tenantId, userSession, payload);
        break;

      // Journals
      case 'listJournals':
        result = financeService.listJournals(userSession.tenantId);
        break;
      case 'createJournal':
        result = financeService.createJournal(userSession.tenantId, payload);
        break;

      // Payments
      case 'listPayments':
        result = financeService.listPayments(userSession.tenantId);
        break;
      case 'createPayment':
        result = await financeService.createPayment(userSession.tenantId, payload);
        break;
      case 'updatePaymentStatus':
        result = financeService.updatePaymentStatus(userSession.tenantId, payload.id, payload.status);
        break;
      case 'createPaymentRequest':
        result = await financeService.createPaymentRequest(userSession.tenantId, userSession, payload);
        break;

      // Documents
      case 'listDocuments':
        result = financeService.listDocuments(userSession.tenantId);
        break;
      case 'uploadDocumentForApproval':
        result = financeService.uploadDocumentForApproval(userSession.tenantId, userSession, payload);
        break;
      case 'updateDocumentStatus':
        result = financeService.updateDocumentStatus(userSession.tenantId, payload.id, payload.status);
        break;

      // Policies
      case 'listPolicies':
        result = financeService.listPolicies(userSession.tenantId);
        break;
      case 'createPolicy':
        result = financeService.createPolicy(userSession.tenantId, payload);
        break;
      case 'togglePolicy':
        result = financeService.togglePolicy(userSession.tenantId, payload.id);
        break;

      // Periods
      case 'listPeriods':
        result = financeService.listPeriods(userSession.tenantId);
        break;
      case 'lockPeriod':
        result = financeService.lockPeriod(userSession.tenantId, payload.id);
        break;
      case 'approvePeriodClose':
        result = financeService.approvePeriodClose(userSession.tenantId, payload.id);
        break;
      case 'markPeriodFailed':
        result = financeService.markPeriodFailed(userSession.tenantId, payload.id);
        break;
      case 'reopenPeriod':
        result = financeService.reopenPeriod(userSession.tenantId, payload.id);
        break;
      case 'forceClosePeriod':
        result = financeService.forceClosePeriod(userSession.tenantId, payload.id);
        break;

      // Insights & Alerts
      case 'getFinanceInsights':
        result = financeService.getFinanceInsights(userSession.tenantId);
        break;
      case 'getInbox':
        result = await financeService.getInbox(userSession.tenantId, userSession);
        break;
      case 'getAlerts':
        result = await financeService.getAlerts(userSession.tenantId, userSession);
        break;

      // Payroll
      case 'getPayrollEntries':
        result = await payrollService.getPayrollEntries(userSession.tenantId, payload?.period);
        break;
      case 'createPayrollEntry':
        result = await payrollService.createPayrollEntry(payload);
        break;
      case 'updatePayrollEntry':
        result = await payrollService.updatePayrollEntry(payload.entryId, payload.updates);
        break;
      case 'runPayroll':
        result = await payrollService.runPayroll(userSession.tenantId, payload.period);
        break;

      // Treasury
      case 'listSources':
        result = await treasuryService.listSources(userSession.tenantId, userSession);
        break;
      case 'listTransfers':
        result = await treasuryService.listTransfers(userSession.tenantId, userSession);
        break;
      case 'createTransfer':
        result = await treasuryService.createTransfer(userSession.tenantId, userSession, payload);
        break;
      case 'reconcileSettlement':
        result = await treasuryService.reconcileSettlement(
          userSession.tenantId,
          userSession,
          payload.sourceId,
          payload.amount
        );
        break;

      default:
        return res.status(400).json({ message: `Unknown action: ${action}` });
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err instanceof Error ? err.message : 'Internal Server Error' });
  }
}
