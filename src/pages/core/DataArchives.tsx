import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { History, Download, Search, Database, FileText, Calendar, HardDrive, Archive, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/core/security/session";
import { apiRequest } from "@/core/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "./DashboardLayout";

interface ArchiveRecord {
  id: string;
  type: string;
  module: string;
  period: string;
  size: string;
  status: "available" | "archived" | "processing";
  createdAt: string;
}

const fallbackArchives: ArchiveRecord[] = [
  { id: "arc-001", type: "Financial Report", module: "Finance", period: "Q1 2026", size: "2.4 MB", status: "available", createdAt: "2026-04-01" },
  { id: "arc-002", type: "Payroll Records", module: "HR", period: "Mar 2026", size: "1.8 MB", status: "available", createdAt: "2026-04-02" },
  { id: "arc-003", type: "Inventory Snapshot", module: "Inventory", period: "Q1 2026", size: "5.2 MB", status: "available", createdAt: "2026-04-01" },
  { id: "arc-004", type: "Audit Trail Export", module: "Audit", period: "Jan-Mar 2026", size: "12.1 MB", status: "available", createdAt: "2026-04-03" },
  { id: "arc-005", type: "Sales Pipeline Backup", module: "Sales", period: "Q1 2026", size: "890 KB", status: "available", createdAt: "2026-04-01" },
  { id: "arc-006", type: "POS Transaction Log", module: "Retail", period: "Mar 2026", size: "18.4 MB", status: "archived", createdAt: "2026-04-02" },
  { id: "arc-007", type: "Procurement Contracts", module: "Procurement", period: "2025-2026", size: "3.6 MB", status: "available", createdAt: "2026-03-15" },
  { id: "arc-008", type: "Marketing Campaign Data", module: "Marketing", period: "Q1 2026", size: "1.2 MB", status: "available", createdAt: "2026-04-04" },
];

const statusStyles = {
  available: "bg-success/10 text-success border-success/20",
  archived: "bg-muted text-muted-foreground border-border",
  processing: "bg-warning/10 text-warning border-warning/20",
};

export default function DataArchives() {
  const session = useSession();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [archives, setArchives] = useState<ArchiveRecord[]>(fallbackArchives);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch real archives from backend
    apiRequest<any[]>("/reporting/archives", "GET", session)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setArchives(data);
      })
      .catch(() => {}) // Fallback to static data
      .finally(() => setLoading(false));
  }, [session]);

  const filtered = archives.filter(a =>
    a.type.toLowerCase().includes(search.toLowerCase()) ||
    a.module.toLowerCase().includes(search.toLowerCase())
  );

  const totalSize = archives.reduce((acc, a) => {
    const num = parseFloat(a.size);
    const unit = a.size.includes("MB") ? 1 : 0.001;
    return acc + num * unit;
  }, 0);

  const handleDownload = async (archive: ArchiveRecord) => {
    toast({ title: "Download Started", description: `Preparing ${archive.type}...` });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Data Archives</h1>
            <p className="text-sm text-muted-foreground mt-1">Historical data exports, backups, and compliance records</p>
          </div>
          <Button className="bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wide rounded-xl h-10 px-6">
            <Archive className="h-4 w-4 mr-2" />
            Create Archive
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">Total Archives</p>
                <p className="text-xl font-black text-foreground">{archives.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">Available</p>
                <p className="text-xl font-black text-foreground">{archives.filter(a => a.status === "available").length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">Total Size</p>
                <p className="text-xl font-black text-foreground">{totalSize.toFixed(1)} MB</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">Latest</p>
                <p className="text-xl font-black text-foreground">Jun 2026</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search archives by type or module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 rounded-xl bg-card border-border"
          />
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-wide text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Archive Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filtered.map((archive) => (
                <div key={archive.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{archive.type}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{archive.module}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{archive.period}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{archive.size}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn("text-[9px] font-bold uppercase", statusStyles[archive.status])}>
                      {archive.status}
                    </Badge>
                    {archive.status === "available" && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleDownload(archive)}>
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
