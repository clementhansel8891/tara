import { useState, useEffect } from "react";
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
import {
  Upload,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileArchive,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/core/security/session";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/core/api/apiClient";
import { Progress } from "@/components/ui/progress";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: string;
  title: string;
  onSuccess: (data: any) => void;
  type?: "DATA" | "IMAGES";
}

export function ImportDialog({
  open,
  onOpenChange,
  endpoint,
  title,
  onSuccess,
  type = "DATA",
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const session = useSession();

  useEffect(() => {
    let interval: any;
    if (jobId && open) {
      interval = setInterval(async () => {
        try {
          const data = await apiRequest<any>(
            `inventory/import/status/${jobId}`,
            "GET",
            session
          );
          setStatus(data);
          if (data.status === "COMPLETED" || data.status === "FAILED") {
            clearInterval(interval);
            if (data.status === "COMPLETED") {
              toast.success("Import completed successfully");
              onSuccess(data);
            } else {
              toast.error("Import failed");
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [jobId, open, session]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    setJobId(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await apiRequest<any>(endpoint, "POST", session, formData);
      if (data.success && data.jobId) {
        setJobId(data.jobId);
        toast.info("Import job started in background");
      } else if (data.success) {
        // Fallback for non-async endpoints
        toast.success(data.message || "Import completed");
        onSuccess(data.data);
        onOpenChange(false);
      } else {
        toast.error(data.message || "Import initiation failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const isProcessing = status && (status.status === "PENDING" || status.status === "PROCESSING");
  const isCompleted = status && status.status === "COMPLETED";
  const isFailed = status && status.status === "FAILED";

  const progress = status?.total_items > 0 
    ? Math.round((status.processed_items / status.total_items) * 100) 
    : isProcessing ? 5 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {type === "IMAGES" 
              ? "Upload a ZIP archive containing product images." 
              : "Upload a CSV or Excel file to bulk import records."}
          </DialogDescription>
        </DialogHeader>

        {jobId ? (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              {isProcessing && (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <div className="space-y-1">
                    <p className="font-medium">Processing Import...</p>
                    <p className="text-sm text-muted-foreground">
                      {status.processed_items} of {status.total_items || "?"} items processed
                    </p>
                  </div>
                  <Progress value={progress} className="w-full" />
                </>
              )}

              {isCompleted && (
                <>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Import Completed</p>
                    <p className="text-sm text-muted-foreground">
                      Successfully processed {status.processed_items} items.
                    </p>
                  </div>
                </>
              )}

              {isFailed && (
                <>
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-red-600">Import Failed</p>
                    <p className="text-sm text-muted-foreground">
                      An error occurred during processing.
                    </p>
                  </div>
                </>
              )}
            </div>

            {status?.errors && status.errors.length > 0 && (
              <ScrollArea className="h-40 rounded border p-2 bg-slate-50">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-600 px-1">Detailed Errors:</p>
                  {status.errors.map((err: any, i: number) => (
                    <div key={i} className="text-[10px] border-b pb-1 last:border-0">
                      <p className="text-red-500">• {err.message || JSON.stringify(err)}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setJobId(null);
                  setStatus(null);
                  setFile(null);
                }}
                disabled={isProcessing}
              >
                Start New Import
              </Button>
              <Button onClick={() => onOpenChange(false)} disabled={isProcessing}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="file-upload">
                Select {type === "IMAGES" ? "ZIP Archive" : "File (CSV, XLSX)"}
              </Label>
              <div 
                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer relative"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {file ? (
                  <>
                    {type === "IMAGES" ? <FileArchive className="h-8 w-8 text-blue-500" /> : <FileText className="h-8 w-8 text-primary" />}
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-slate-400" />
                    <span className="text-sm text-slate-600">Click to browse or drag and drop</span>
                    <span className="text-xs text-slate-400">
                      {type === "IMAGES" ? "Max archive size: 1GB" : "Max file size: 500MB"}
                    </span>
                  </>
                )}
                <Input
                  id="file-upload"
                  type="file"
                  accept={type === "IMAGES" ? ".zip" : ".csv, .xlsx"}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={loading || !file}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {loading ? "Initializing..." : "Upload & Process"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
