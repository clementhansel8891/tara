import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Wallet, Landmark, CreditCard } from 'lucide-react';

export const CashPositionWidget: React.FC = () => {
  const navigate = useNavigate();

  const data = [
    { name: 'Bank Accounts', value: 750000, color: '#4f46e5', icon: Landmark },
    { name: 'Digital Wallets', value: 120000, color: '#10b981', icon: Wallet },
    { name: 'Credit Lines', value: 500000, color: '#f59e0b', icon: CreditCard },
  ];

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <WorkspacePanel 
      title="Cash Position" 
      description="Liquidity across all money sources"
      variant="glass"
      className="cursor-pointer"
      onClick={() => navigate('/core/finance/treasury')}
    >
      <div className="flex items-center gap-6">
        <div className="relative h-[180px] w-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Total</p>
            <p className="text-xl font-black text-foreground">${(total / 1000000).toFixed(1)}M</p>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-1.5" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-600">{item.name}</span>
              </div>
              <span className="text-xs font-black text-slate-900">${(item.value / 1000).toFixed(0)}k</span>
            </div>
          ))}
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Est. Runway</span>
              <span className="text-xs font-black text-indigo-600">184 Days</span>
            </div>
          </div>
        </div>
      </div>
    </WorkspacePanel>
  );
};
