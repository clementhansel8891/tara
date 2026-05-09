import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Banknote, Delete, CheckCircle2 } from "lucide-react";

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (received: number, notes: string) => void;
}

export const CashPaymentModal: React.FC<CashPaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  onConfirm,
}) => {
  const [received, setReceived] = useState<string>("0");
  const [notes, setNotes] = useState("");

  const receivedAmount = parseFloat(received) || 0;
  const change = Math.max(0, receivedAmount - total);
  const isInsufficient = receivedAmount < total;

  useEffect(() => {
    if (isOpen) setReceived("0");
  }, [isOpen]);

  const handleKeyPress = (val: string) => {
    setReceived((prev) => {
      if (prev === "0") return val;
      return prev + val;
    });
  };

  const handleBackspace = () => {
    setReceived((prev) => {
      if (prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
  };

  const quickAmounts = [50000, 100000, 200000, 500000];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/40 backdrop-blur-sm" />

      <DialogContent
        className="
        sm:max-w-[560px]
        w-[95vw]
        h-[90vh]
        border-none
        bg-background/95
        backdrop-blur-xl
        text-foreground
        rounded-[2rem]
        shadow-2xl
        p-0
        flex
        flex-col
      "
      >
        <div className="flex flex-col h-full p-6 gap-5">
          {/* HEADER */}
          <DialogHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
                <Banknote className="w-6 h-6" />
              </div>

              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-widest italic text-foreground">
                  Cash Payment
                </DialogTitle>

                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Process physical tender
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* TOTAL + CHANGE */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] italic">
                Total Due
              </span>

              <div className="text-2xl font-black italic tracking-tighter">
                Rp {total.toLocaleString()}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-black text-success uppercase tracking-[0.2em] italic">
                Change
              </span>

              <div
                className={`text-2xl font-black italic tracking-tighter ${
                  change > 0 ? "text-success" : "text-foreground/20"
                }`}
              >
                Rp {change.toLocaleString()}
              </div>
            </div>
          </div>

          {/* RECEIVED DISPLAY */}
          <div className="bg-secondary/50 border border-border rounded-2xl py-6 flex flex-col items-center justify-center">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Amount Received
            </span>

            <div className="text-5xl font-black italic tracking-tighter text-success">
              Rp {receivedAmount.toLocaleString()}
            </div>
          </div>

          {/* KEYPAD AREA (FLEXIBLE HEIGHT) */}
          <div className="flex flex-1 gap-4">
            {/* QUICK AMOUNTS */}
            <div className="flex flex-col gap-3 w-[90px]">
              {(Array.isArray(quickAmounts) ? quickAmounts : []).map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  onClick={() => setReceived(amt.toString())}
                  className="flex-1 bg-secondary/50 border-border hover:bg-secondary text-[11px] font-black tracking-widest rounded-xl active:scale-95 text-foreground"
                >
                  {amt / 1000}K
                </Button>
              ))}
            </div>

            {/* NUMPAD */}
            <div className="flex-1 grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "00", 0].map((n) => (
                <Button
                  key={n}
                  variant="ghost"
                  onClick={() => handleKeyPress(n.toString())}
                  className="
                    h-full
                    text-2xl
                    font-black
                    bg-secondary/50
                    hover:bg-secondary
                    text-foreground
                    rounded-2xl
                    active:scale-90
                  "
                >
                  {n}
                </Button>
              ))}

              <Button
                variant="ghost"
                onClick={handleBackspace}
                className="
                  h-full
                  bg-secondary/50
                  hover:bg-destructive/20
                  text-destructive
                  rounded-2xl
                  active:scale-90
                "
              >
                <Delete className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* TRANSACTION NOTES */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
              Transaction Notes
            </span>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional notes for this order..."
              className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground rounded-xl resize-none h-16 font-bold italic text-sm focus-visible:ring-success/20 focus-visible:border-success"
            />
          </div>

          {/* CONFIRM BUTTON */}
          <Button
            onClick={() => onConfirm(receivedAmount, notes)}
            disabled={isInsufficient}
            className={`h-16 rounded-[1.25rem] flex items-center justify-center gap-3 transition-all active:scale-95 ${
              isInsufficient
                ? "bg-muted text-muted-foreground"
                : "bg-success hover:bg-success/90 text-success-foreground shadow-[0_20px_50px_-10px_hsl(var(--success)/0.3)]"
            }`}
          >
            {isInsufficient ? (
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                Insufficient Amount
              </span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                  Finalize Transaction
                </span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
