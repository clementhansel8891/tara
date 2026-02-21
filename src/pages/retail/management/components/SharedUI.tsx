import React from "react";
import { Copy, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CredentialFieldProps {
  label: string;
  value: string;
  tooltip: string;
  helperText?: string;
  placeholder?: string;
  copyable?: boolean;
  onCopy?: () => void;
}

export const CredentialField = ({
  label,
  value,
  tooltip,
  helperText,
  placeholder,
  copyable,
  onCopy,
}: CredentialFieldProps) => {
  const displayValue = value || placeholder || "Not available";
  const isMissing = !value;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <span>{label}</span>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center justify-center cursor-help">
                <Info className="w-3 h-3 text-slate-400" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-2">
        <code
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-mono font-bold truncate ${
            isMissing ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-slate-100"
          }`}
        >
          {displayValue}
        </code>
        {copyable && onCopy && (
          <Button
            variant="outline"
            size="icon"
            className="border-slate-700 text-slate-200 hover:text-white shrink-0"
            onClick={onCopy}
          >
            <Copy className="w-4 h-4" />
          </Button>
        )}
      </div>
      {helperText && (
        <p className="text-[10px] text-slate-500 font-semibold">{helperText}</p>
      )}
    </div>
  );
};

interface CopyPillProps {
  label: string;
  value: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const CopyPill = ({ label, value, onClick }: CopyPillProps) => (
  <Button
    size="sm"
    variant="outline"
    className="h-8 rounded-full border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600"
    onClick={onClick}
    disabled={!value}
    type="button"
  >
    <Copy className="w-3 h-3 mr-2" />
    {label}
  </Button>
);
