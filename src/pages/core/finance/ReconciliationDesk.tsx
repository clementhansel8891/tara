import React, { useState, useEffect } from 'react';
import { 
  Bank, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Search,
  CloudUpload,
  Link as LinkIcon,
  Unlink,
  Check
} from 'lucide-react';
import { useSession } from '@/core/security/session';
import { financeService } from '@/core/services/finance/financeService';
import { useCFO } from "@/core/finance/CFOContext";
import { GlobalFinancialFilterBar } from "./components/GlobalFinancialFilterBar";
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface BankTransaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  reference: string;
  status: 'UNMATCHED' | 'PARTIALLY_MATCHED' | 'MATCHED' | 'RECONCILED';
}

interface LedgerEntry {
  id: string;
  ref: string;
  posting_date: string;
  description: string;
  amount: number;
}

export const ReconciliationDesk: React.FC = () => {
  const session = useSession();
  const { state } = useCFO();
  const [statements, setStatements] = useState<any[]>([]);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
  const [bankTxs, setBankTxs] = useState<BankTransaction[]>([]);
  const [unmatchedLedger, setUnmatchedLedger] = useState<LedgerEntry[]>([]);
  const [selectedBankTx, setSelectedBankTx] = useState<BankTransaction | null>(null);
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStatements();
  }, []);

  useEffect(() => {
    if (selectedStatementId) {
      fetchStatementDetails(selectedStatementId);
    }
  }, [selectedStatementId]);

  const fetchStatements = async () => {
    try {
      // In a real app, we'd list statements. For now, assume we have a list.
      const res = await financeService.getMoneySources(session.tenant_id, session);
      // Logic to list statements...
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStatementDetails = async (id: string) => {
    setIsLoading(true);
    try {
      // Fetch transactions for the statement
      // For now, let's assume we have an endpoint for this or use general list
      // Mocking the result for the demo Desk
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoMatch = async () => {
    if (!selectedStatementId) return;
    setIsLoading(true);
    try {
      const res = await financeService.autoMatchTransactions(session, selectedStatementId);
      toast({ title: 'Auto-Match Complete', description: `Matched ${res.matched} transactions.` });
      fetchStatementDetails(selectedStatementId);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualMatch = async () => {
    if (!selectedBankTx || selectedLedgerIds.length === 0) return;
    try {
      await financeService.manualMatchTransactions(session, selectedBankTx.id, selectedLedgerIds);
      toast({ title: 'Match Successful' });
      fetchStatementDetails(selectedStatementId!);
      setSelectedLedgerIds([]);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleFinalize = async () => {
    if (!selectedStatementId) return;
    try {
      await financeService.finalizeReconciliation(session, selectedStatementId);
      toast({ title: 'Statement Reconciled' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <GlobalFinancialFilterBar />

      <header className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bank className="w-8 h-8 text-indigo-600" />
            Bank Reconciliation Desk
          </h1>
          <p className="text-slate-500">Reconcile bank statements with your internal ledger</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex gap-2">
            <CloudUpload className="w-4 h-4" /> Import Statement
          </Button>
          <Button onClick={handleAutoMatch} disabled={!selectedStatementId || isLoading} className="bg-indigo-600 hover:bg-indigo-700">
            Auto-Match All
          </Button>
          <Button onClick={handleFinalize} disabled={!selectedStatementId} variant="success">
            Finalize Statement
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Bank Transactions */}
        <Card className="col-span-12 lg:col-span-7 border-none shadow-xl bg-white/80 backdrop-blur-lg">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Bank Statement Transactions</CardTitle>
                <CardDescription>Select a transaction to find matches</CardDescription>
              </div>
              <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                {bankTxs.length} Transactions
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100 z-10">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Description</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Amount</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bankTxs.map((tx) => (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedBankTx(tx)}
                      className={`cursor-pointer hover:bg-indigo-50/50 transition-colors ${selectedBankTx?.id === tx.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'border-b border-slate-100'}`}
                    >
                      <td className="p-4 text-sm font-medium">{tx.transaction_date}</td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-slate-700">{tx.description}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{tx.reference}</div>
                      </td>
                      <td className={`p-4 text-sm font-black text-right ${tx.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={
                          tx.status === 'MATCHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          tx.status === 'PARTIALLY_MATCHED' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }>
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Right: Matches & Ledger */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-lg border-l-4 border-indigo-500">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-indigo-500" />
                Manual Matching
              </CardTitle>
              <CardDescription>
                {selectedBankTx 
                  ? `Matching: ${selectedBankTx.description} (${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedBankTx.amount)})`
                  : 'Select a bank transaction to begin matching'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedBankTx ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-indigo-400">
                      <span>Total Selected</span>
                      <span>Target Difference</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <div className="text-2xl font-black text-indigo-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                          (Array.isArray(unmatchedLedger) ? unmatchedLedger : []).filter(l => selectedLedgerIds.includes(l.id)).reduce((acc, l) => acc + l.amount, 0)
                        )}
                      </div>
                      <div className={`text-sm font-bold ${
                        Math.abs(selectedBankTx.amount - (Array.isArray(unmatchedLedger) ? unmatchedLedger : []).filter(l => selectedLedgerIds.includes(l.id)).reduce((acc, l) => acc + l.amount, 0)) < 0.01
                          ? 'text-emerald-600'
                          : 'text-rose-500'
                      }`}>
                        Δ {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                          selectedBankTx.amount - (Array.isArray(unmatchedLedger) ? unmatchedLedger : []).filter(l => selectedLedgerIds.includes(l.id)).reduce((acc, l) => acc + l.amount, 0)
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleManualMatch} 
                    disabled={selectedLedgerIds.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg font-bold"
                  >
                    Confirm Match ({selectedLedgerIds.length})
                  </Button>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 italic">
                  Select a bank transaction on the left
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-lg">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-sm uppercase tracking-widest text-slate-500">Unmatched Ledger Entries</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[400px]">
                {unmatchedLedger.map((entry) => (
                  <div 
                    key={entry.id}
                    onClick={() => {
                      if (selectedLedgerIds.includes(entry.id)) {
                        setSelectedLedgerIds(prev => (Array.isArray(prev) ? prev : []).filter(id => id !== entry.id));
                      } else {
                        setSelectedLedgerIds(prev => [...prev, entry.id]);
                      }
                    }}
                    className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors flex justify-between items-center ${selectedLedgerIds.includes(entry.id) ? 'bg-emerald-50/50' : ''}`}
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-700">{entry.description}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{entry.ref} • {entry.posting_date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-black text-slate-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(entry.amount)}
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        selectedLedgerIds.includes(entry.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                      }`}>
                        {selectedLedgerIds.includes(entry.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
