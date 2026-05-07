import * as React from "react";
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Building2, 
  MapPin, 
  UserPlus, 
  Rocket,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { orgSettingsService } from "@/core/services/orgSettingsService";
import { adminService } from "@/core/services/adminService";
import { useAuth } from "@/contexts/AuthContext";

interface StrategicExpansionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

export function StrategicExpansionModal({ 
  isOpen, 
  onOpenChange,
  featureName = "Strategic Expansion"
}: StrategicExpansionModalProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMode, setSuccessMode] = useState<string | null>(null);

  // Form States
  const [companyForm, setCompanyForm] = useState({ name: "", industry: "retail", country: "US", currency: "USD" });
  const [branchForm, setBranchForm] = useState({ name: "", address: "", email: "", phone: "" });
  const [inviteForm, setInviteForm] = useState({ email: "", role: "ADMIN", department: "executive" });

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading(true);
    try {
      await orgSettingsService.createChildCompany(session, companyForm);
      setSuccessMode("company");
      toast.success("Subsidiary Successfully Provisioned");
    } catch (err: any) {
      toast.error(err.message || "Failed to create subsidiary");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading(true);
    try {
      await orgSettingsService.createLocation(session, branchForm);
      setSuccessMode("branch");
      toast.success("Corporate Branch Registered");
    } catch (err: any) {
      toast.error(err.message || "Failed to create branch");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading(true);
    try {
      await adminService.createInvitation(session, inviteForm);
      setSuccessMode("invite");
      toast.success("Executive Invitation Dispatched");
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setSuccessMode(null);
    setCompanyForm({ name: "", industry: "retail", country: "US", currency: "USD" });
    setBranchForm({ name: "", address: "", email: "", phone: "" });
    setInviteForm({ email: "", role: "ADMIN", department: "executive" });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetAndClose();
      else onOpenChange(true);
    }}>
      <DialogContent className="sm:max-w-[700px] rounded-[3.5rem] border border-slate-100 bg-white p-0 overflow-hidden shadow-2xl">
        {/* Header Area */}
        <div className="bg-slate-950 p-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Rocket className="h-5 w-5 text-indigo-400" />
              </div>
              <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic text-white">
                Enterprise Provisioning
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 font-medium">
              Execute strategic growth initiatives across the global organizational matrix.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Area */}
        <div className="p-10 relative bg-slate-50">
          {successMode ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center mb-4 shadow-xl shadow-emerald-100">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-black italic tracking-tight text-slate-900 uppercase">
                {successMode === "company" && "Subsidiary Deployed"}
                {successMode === "branch" && "Branch Activated"}
                {successMode === "invite" && "Protocol Initiated"}
              </h3>
              <p className="text-slate-500 font-medium max-w-sm">
                The strategic expansion command has been successfully executed and recorded in the global ledger.
              </p>
              <Button onClick={resetAndClose} className="mt-8 h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs">
                Acknowledge & Close
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="company" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-slate-200/50 rounded-2xl p-1">
                <TabsTrigger value="company" className="rounded-xl font-black uppercase tracking-wider text-[10px] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                  <Building2 className="h-4 w-4 mr-2" /> Subsidiary
                </TabsTrigger>
                <TabsTrigger value="branch" className="rounded-xl font-black uppercase tracking-wider text-[10px] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                  <MapPin className="h-4 w-4 mr-2" /> Corp Branch
                </TabsTrigger>
                <TabsTrigger value="invite" className="rounded-xl font-black uppercase tracking-wider text-[10px] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                  <UserPlus className="h-4 w-4 mr-2" /> Recruitment
                </TabsTrigger>
              </TabsList>

              <TabsContent value="company" className="space-y-6 mt-0">
                <form onSubmit={handleCreateCompany} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Legal Entity Name</Label>
                      <Input required value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} placeholder="e.g. Zenvix Logistics LLC" className="h-12 rounded-xl bg-white border-slate-200" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Base Currency</Label>
                        <Input required value={companyForm.currency} onChange={e => setCompanyForm({...companyForm, currency: e.target.value})} placeholder="USD" className="h-12 rounded-xl bg-white border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Industry Module</Label>
                        <Input required value={companyForm.industry} onChange={e => setCompanyForm({...companyForm, industry: e.target.value})} placeholder="retail" className="h-12 rounded-xl bg-white border-slate-200" />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-200">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Provision Subsidiary Environment"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="branch" className="space-y-6 mt-0">
                <form onSubmit={handleCreateBranch} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Office Name</Label>
                      <Input required value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})} placeholder="e.g. EMEA Regional HQ" className="h-12 rounded-xl bg-white border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Physical Address</Label>
                      <Input required value={branchForm.address} onChange={e => setBranchForm({...branchForm, address: e.target.value})} placeholder="Full address" className="h-12 rounded-xl bg-white border-slate-200" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Email</Label>
                        <Input type="email" value={branchForm.email} onChange={e => setBranchForm({...branchForm, email: e.target.value})} placeholder="office@company.com" className="h-12 rounded-xl bg-white border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone</Label>
                        <Input value={branchForm.phone} onChange={e => setBranchForm({...branchForm, phone: e.target.value})} placeholder="+1..." className="h-12 rounded-xl bg-white border-slate-200" />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-200">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Register Corporate Branch"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="invite" className="space-y-6 mt-0">
                <form onSubmit={handleCreateInvite} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Executive Email</Label>
                      <Input required type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} placeholder="executive@domain.com" className="h-12 rounded-xl bg-white border-slate-200" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Role</Label>
                        <Input required value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Department</Label>
                        <Input required value={inviteForm.department} onChange={e => setInviteForm({...inviteForm, department: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200" />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-200">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Dispatch Magic Link"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
