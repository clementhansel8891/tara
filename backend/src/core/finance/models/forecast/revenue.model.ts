import { ForecastContext, ForecastDay, ForecastModel } from '../../types/forecast.types';

export class RevenueModel implements ForecastModel {
  readonly name = 'REVENUE_WMA_MODEL';

  predict(context: ForecastContext, days: number): ForecastDay[] {
    const { historicalSnapshots, scenarioInputs } = context;
    const revenueMultiplier = scenarioInputs?.revenueMultiplier ?? 1.0;

    // 1. Extract periodic inflows (e.g., monthly)
    // In a real system, these would be aggregated from ledger or snapshots.
    // For the skeleton, we mock periodic inflows from historical snapshot balances (or inflow metrics).
    const periodicInflows = historicalSnapshots.map(s => s.totalInflow || 0).filter(v => v > 0);

    // 2. Compute Weighted Moving Average (WMA)
    // Weights for 6 periods (prioritizing recent months)
    const weights = [0.3, 0.2, 0.15, 0.15, 0.1, 0.1].slice(0, periodicInflows.length);
    const weightTotal = weights.reduce((a, b) => a + b, 0);
    const weightedSum = periodicInflows.slice(0, weights.length).reduce((sum, val, i) => sum + (val * weights[i]), 0);
    
    const monthlyBaseline = weightTotal > 0 ? (weightedSum / weightTotal) : 0;
    const dailyInflow = (monthlyBaseline / 30) * revenueMultiplier;

    // 3. Generate Forecasted Days
    const forecastDays: ForecastDay[] = [];
    const baseDate = new Date(context.cashflowBaseline.snapshotTimestamp);

    for (let i = 1; i <= days; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        forecastDays.push({
            date: date.toISOString().split('T')[0],
            inflow: Number(dailyInflow.toFixed(2)),
            outflow: 0, // Outflow handled by ExpenseModel
            closingBalance: 0, // Will be computed by aggregator
            isForecasted: true,
            confidence: Math.max(0.4, 1.0 - (i / 180)) // Horizon degradation
        });
    }

    return forecastDays;
  }
}
