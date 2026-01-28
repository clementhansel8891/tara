import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDashboardStats, mockTasks, mockIncidents, formatCurrency } from '@/lib/mock-data';
import { DollarSign, ShoppingBag, Users, AlertTriangle } from 'lucide-react';

export default function CoreDashboard() {
  const stats = mockDashboardStats;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Today's overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon={DollarSign}
          trend={stats.salesTrend}
          trendLabel="vs yesterday"
          variant="primary"
        />
        <StatCard
          title="Transactions"
          value={stats.todayTransactions}
          icon={ShoppingBag}
          variant="default"
        />
        <StatCard
          title="Active Staff"
          value={stats.activeStaff}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Open Issues"
          value={stats.openIssues}
          icon={AlertTriangle}
          variant={stats.openIssues > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                </div>
                <StatusBadge status={task.status} size="sm" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockIncidents.map((incident) => (
              <div key={incident.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{incident.title}</p>
                  <p className="text-xs text-muted-foreground">Reported by {incident.reportedBy}</p>
                </div>
                <StatusBadge status={incident.status} size="sm" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
