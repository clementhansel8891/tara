import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export interface ExportSettings {
  watermarkText: string;
  opacity: number;
  size: number;
  position: { x: number; y: number };
  includeForensic: boolean;
}

interface ExportSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (settings: ExportSettings) => void;
}

export function ExportSettingsDialog({
  open,
  onOpenChange,
  onConfirm,
}: ExportSettingsDialogProps) {
  const [settings, setSettings] = useState<ExportSettings>({
    watermarkText: "CONFIDENTIAL",
    opacity: 0.2,
    size: 72,
    position: { x: 5, y: 10 },
    includeForensic: true,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Secure Export Settings
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Alert variant="default" className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertTitle>Forensic Traceability Active</AlertTitle>
            <AlertDescription className="text-xs">
              Every export is tagged with a unique forensic ID linked to your session, IP, and timestamp for legal compliance.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="watermark">Watermark Text</Label>
              <Input
                id="watermark"
                value={settings.watermarkText}
                onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
                placeholder="e.g. CONFIDENTIAL"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Opacity ({Math.round(settings.opacity * 100)}%)</Label>
                <Slider
                  value={[settings.opacity * 100]}
                  min={5}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setSettings({ ...settings, opacity: v / 100 })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Size ({settings.size}pt)</Label>
                <Slider
                  value={[settings.size]}
                  min={12}
                  max={144}
                  step={4}
                  onValueChange={([v]) => setSettings({ ...settings, size: v })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Column Position</Label>
                <Input
                  type="number"
                  value={settings.position.x}
                  onChange={(e) => setSettings({
                    ...settings,
                    position: { ...settings.position, x: parseInt(e.target.value) || 1 }
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Row Position</Label>
                <Input
                  type="number"
                  value={settings.position.y}
                  onChange={(e) => setSettings({
                    ...settings,
                    position: { ...settings.position, y: parseInt(e.target.value) || 1 }
                  })}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onConfirm(settings)}>Export Document</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
