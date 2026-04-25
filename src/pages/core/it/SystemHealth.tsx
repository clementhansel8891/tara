import { useEffect, useState } from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSession } from "@/core/security/session";
import { itService, type SystemHealth as SystemHealthType } from "@/core/services/it/itService";

export default function SystemHealth() {
  const session = useSession();
  const [healthData, setHealthData] = useState<SystemHealthType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      try {
        const data = await itService.getSystemHealth(session.tenant_id, session);
        setHealthData(data);
      } catch (err) {
        console.error("Failed to fetch system health", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, [session.tenant_id, session]);

  const filtered = healthData.filter((evt) =>
    search ? evt.component.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        subtitle="Live health monitoring with alert escalation."
        secondaryActions={
          <Input
            placeholder="Filter components"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Events" description="LAN-first telemetry with auto escalation.">
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Component</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Latency</th>
                <th className="p-3 text-left">Checked At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-3 text-center">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="p-3 text-center text-muted-foreground">No health events tracked.</td></tr>
              ) : (
                filtered.map((evt) => (
                  <tr key={evt.id} className="border-t">
                    <td className="p-3 font-medium">{evt.component}</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          evt.status === "healthy"
                            ? "secondary"
                            : evt.status === "warning"
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {evt.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{evt.latencyMs}ms</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {new Date(evt.checkedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>
    </div>
  );
}
