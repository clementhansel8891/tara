import { CashflowOutput } from './cashflow.types';

export interface ForecastDay {
  date: string;
  inflow: number;
  outflow: number;
  closingBalance: number;
  isForecasted: boolean;
  confidence: number;
}

export interface ForecastOutput {
  projection: ForecastDay[];
  horizonDays: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  trend: 'UP' | 'DOWN' | 'STABLE';
  seasonalityDetected: boolean;
  forecastHash: string;
  snapshotSequence: number;
  generatedAt: string;
}

export interface ForecastContext {
  tenantId: string;
  companyId: string;
  snapshotSequence: number;
  historicalSnapshots: any[];
  cashflowBaseline: CashflowOutput;
  scenarioInputs?: {
    revenueMultiplier?: number;
    expenseMultiplier?: number;
    delayDays?: number;
  };
}

export interface ForecastModel {
  name: string;
  predict(context: ForecastContext, days: number): ForecastDay[];
}
