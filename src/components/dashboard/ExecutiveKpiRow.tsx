import { KpiRibbonCard } from './KpiRibbonCard';
import { EnterpriseHealthWidget } from './StrategicScorecard';
import { DashboardKpi } from '@/types/dashboard.types';

interface ExecutiveKpiRowProps {
  kpis: DashboardKpi[];
}

export const ExecutiveKpiRow: React.FC<ExecutiveKpiRowProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {kpis.slice(0, 4).map((kpi, index) => (
        <KpiRibbonCard 
          key={index}
          {...kpi}
        />
      ))}
    </div>
  );
};
