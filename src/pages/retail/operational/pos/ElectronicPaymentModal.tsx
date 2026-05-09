import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  QrCode,
  Smartphone,
  RefreshCw,
  X,
  CheckCircle2,
} from "lucide-react";

interface ElectronicPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  isProcessing: boolean;
  onConfirm: (method: "CARD" | "QRIS" | "WALLET", channel?: string, notes?: string) => void;
}

export const ElectronicPaymentModal: React.FC<ElectronicPaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  isProcessing,
  onConfirm,
}) => {
  const [selectedMain, setSelectedMain] = useState<
    "CARD" | "QRIS" | "WALLET" | null
  >(null);
  const [notes, setNotes] = useState("");

  const channels = {
    CARD: [
      { id: "VISA", name: "Visa", icon: <CreditCard className="w-5 h-5" /> },
      {
        id: "MASTERCARD",
        name: "Mastercard",
        icon: <CreditCard className="w-5 h-5" />,
      },
      {
        id: "DEBIT",
        name: "Debit Card",
        icon: <CreditCard className="w-5 h-5" />,
      },
    ],
    QRIS: [
      {
        id: "QRIS_GOPAY",
        name: "Gopay",
        icon: <Smartphone className="w-5 h-5" />,
      },
      { id: "QRIS_OVO", name: "OVO", icon: <Smartphone className="w-5 h-5" /> },
      {
        id: "QRIS_SHOPEEPAY",
        name: "ShopeePay",
        icon: <Smartphone className="w-5 h-5" />,
      },
    ],
    WALLET: [
      { id: "DANA", name: "DANA", icon: <Smartphone className="w-5 h-5" /> },
      {
        id: "LINKAJA",
        name: "LinkAja",
        icon: <Smartphone className="w-5 h-5" />,
      },
    ],
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none bg-background text-foreground rounded-[2rem] shadow-2xl">
        <div className="p-10 space-y-10">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <CreditCard className="w-7 h-7" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-widest italic text-foreground">
                  Electronic Payment
                </DialogTitle>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  Select card, QRIS, or digital wallet
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Amount Due Area */}
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex flex-col items-center justify-center gap-1">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">
              Authorization Amount
            </span>
            <div className="text-5xl font-black italic tracking-tighter text-foreground">
              Rp {total.toLocaleString()}
            </div>
          </div>

          <div className="space-y-6">
            {/* Main Categories */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedMain("CARD")}
                className={`h-24 rounded-2xl flex flex-col gap-2 transition-all border-border ${
                  selectedMain === "CARD"
                    ? "bg-primary border-primary text-primary-foreground shadow-lg"
                    : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Credit/Debit
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedMain("QRIS")}
                className={`h-24 rounded-2xl flex flex-col gap-2 transition-all border-border ${
                  selectedMain === "QRIS"
                    ? "bg-primary border-primary text-primary-foreground shadow-lg"
                    : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
                }`}
              >
                <QrCode className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  QRIS
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedMain("WALLET")}
                className={`h-24 rounded-2xl flex flex-col gap-2 transition-all border-border ${
                  selectedMain === "WALLET"
                    ? "bg-primary border-primary text-primary-foreground shadow-lg"
                    : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
                }`}
              >
                <Smartphone className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  E-Wallet
                </span>
              </Button>
            </div>

            {/* Sub-Channels Grid */}
            <div className="min-h-[160px]">
              {selectedMain ? (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {(Array.isArray(channels[selectedMain]) ? channels[selectedMain] : []).map((ch) => (
                    <Button
                      key={ch.id}
                      variant="outline"
                      onClick={() => onConfirm(selectedMain, ch.id, notes)}
                      disabled={isProcessing}
                      className="h-16 bg-secondary/50 border-border hover:bg-secondary hover:border-primary/50 text-foreground rounded-2xl flex items-center justify-start px-6 gap-4"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {ch.icon}
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-widest">
                        {ch.name}
                      </span>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic text-[10px] font-bold uppercase tracking-[0.3em]">
                  Please Select Payment Type
                </div>
              )}
            </div>

            {/* TRANSACTION NOTES */}
            <div className="flex flex-col gap-2 mt-4">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                Transaction Notes
              </span>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add optional notes for this order..."
                className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground rounded-xl resize-none h-16 font-bold italic text-sm focus-visible:ring-primary/20 focus-visible:border-primary"
              />
            </div>
          </div>

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-x-0 bottom-0 bg-background/80 backdrop-blur-sm p-8 flex flex-col items-center justify-center gap-4 animate-in fade-in">
              <RefreshCw className="w-10 h-10 text-primary animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground">
                Waiting for authorization...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
