import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User, Building, MapPin, Briefcase } from "lucide-react";
import type { Employee } from "@/core/types/hr/employee";

interface StaffDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Employee | null;
}

export const StaffDetailsModal: React.FC<StaffDetailsModalProps> = ({
  isOpen,
  onClose,
  staff,
}) => {
  if (!staff) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-slate-900 border-slate-800 p-8 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] text-white">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-black italic tracking-tighter flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400">
              <User className="w-6 h-6" />
            </div>
            PERSONNEL DOSSIER: {staff.fullName.toUpperCase()}
          </DialogTitle>
          <div className="text-[10px] font-black text-blue-400/80 uppercase tracking-widest mt-2 pl-14">
            Immutable Access Record
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 italic">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />{" "}
                Security Status
              </div>
              <Badge
                className={
                  staff.status === "active"
                    ? "bg-emerald-500/20 text-emerald-400 border-none px-3"
                    : "bg-slate-500/20 text-slate-400 border-none px-3"
                }
              >
                {staff.status.toUpperCase()}
              </Badge>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 italic">
                <Building className="w-3.5 h-3.5 text-blue-400" /> Department
              </div>
              <div className="text-sm font-bold">{staff.departmentId}</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 italic">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" /> Role Title
              </div>
              <div className="text-sm font-bold">{staff.roleTitle}</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 italic">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Location Node
              </div>
              <div className="text-sm font-bold">{staff.location}</div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-5 rounded-3xl border border-white/5">
            <div className="text-[10px] font-black uppercase text-slate-500 italic mb-3">
              Access Sub-Scopes
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-slate-900 border border-slate-700 text-slate-300 font-black italic tracking-widest text-[9px] uppercase px-3 py-1">
                RETAIL_CORE
              </Badge>
              <Badge className="bg-slate-900 border border-slate-700 text-slate-300 font-black italic tracking-widest text-[9px] uppercase px-3 py-1">
                POS_EXEC
              </Badge>
              {staff.roleTitle.includes("Head") ||
              staff.roleTitle.includes("Manager") ? (
                <Badge className="bg-blue-900/40 border border-blue-500/30 text-blue-400 font-black italic tracking-widest text-[9px] uppercase px-3 py-1">
                  SHIFT_SUPERVISOR
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="text-center pt-2">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 block">
              Zenvix Global ID: {staff.id}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
