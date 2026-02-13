import { useEffect, useState } from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type HealthEvent = {
  id: string;
  component: string;
  status: "HEALTHY" | "WARN" | "CRITICAL";
  message: string;
  time: string;
};

export default function SystemHealth() {
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setEvents([
      {
        id: "evt-1",
        component: "Edge Gateway - HQ",
        status: "HEALTHY",
        message: "Heartbeat stable",
        time: "Now",
      },
      {
        id: "evt-2",
        component: "LAN Node - Branch 5",
        status: "WARN",
        message: "Packet loss 8%",
        time: "3m ago",
      },
      {
        id: "evt-3",
        component: "MQTT Broker",
        status: "CRITICAL",
        message: "Restarted after failure",
        time: "12m ago",
      },
    ]);
  }, []);

  const filtered = events.filter((evt) =>
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
                <th className="p-3 text-left">Message</th>
                <th className="p-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((evt) => (
                <tr key={evt.id} className="border-t">
                  <td className="p-3 font-medium">{evt.component}</td>
                  <td className="p-3">
                    <Badge
                      variant={
                        evt.status === "HEALTHY"
                          ? "secondary"
                          : evt.status === "WARN"
                            ? "outline"
                            : "destructive"
                      }
                    >
                      {evt.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{evt.message}</td>
                  <td className="p-3 text-muted-foreground">{evt.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>
    </div>
  );
}
