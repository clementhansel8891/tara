import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MousePointer2, Settings2 } from "lucide-react";

interface WatermarkConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (config: { text: string; x: number; y: number }) => void;
}

export function WatermarkConfigDialog({ open, onOpenChange, onConfirm }: WatermarkConfigDialogProps) {
  const [text, setText] = useState("INTERNAL USE ONLY");
  const [posX, setPosX] = useState(3);
  const [posY, setPosY] = useState(5);

  const gridRows = 10;
  const gridCols = 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" /> Watermark Configuration
          </DialogTitle>
          <DialogDescription>
            Customize and position the security watermark for this export.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="wm-text">Watermark Text</Label>
            <Input 
              id="wm-text" 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              placeholder="e.g. CONFIDENTIAL"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Position (Click to Place)</Label>
              <span className="text-xs text-muted-foreground font-mono">X:{posX} Y:{posY}</span>
            </div>
            
            <div className="border rounded-lg p-2 bg-muted/30">
              <div className="grid grid-cols-8 gap-1 aspect-[4/3]">
                {Array.from({ length: gridRows * gridCols }).map((_, i) => {
                  const x = (i % gridCols) + 1;
                  const y = Math.floor(i / gridCols) + 1;
                  const isSelected = x === posX && y === posY;
                  
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setPosX(x);
                        setPosY(y);
                      }}
                      className={`border rounded-sm cursor-pointer transition-all flex items-center justify-center text-[8px]
                        ${isSelected ? "bg-primary border-primary text-primary-foreground shadow-md scale-110 z-10" : "bg-background hover:bg-primary/10 border-muted-foreground/20 text-muted-foreground/30"}
                      `}
                    >
                      {isSelected ? <MousePointer2 className="h-2 w-2" /> : `${String.fromCharCode(64 + x)}${y}`}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-center mt-2 text-muted-foreground italic">
                Simulated spreadsheet grid. Selected: {String.fromCharCode(64 + posX)}{posY}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onConfirm({ text, x: posX, y: posY })}>Config & Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
