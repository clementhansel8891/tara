import { ForecastContext, ForecastDay, ForecastModel } from '../../types/forecast.types';

export class SeasonalityModel implements ForecastModel {
  readonly name = 'SEASONALITY_CYCLE_MODEL';

  predict(context: ForecastContext, days: number): ForecastDay[] {
    const { historicalSnapshots } = context;
    if (historicalSnapshots.length < 3) return [];

    // 1. Detect Month-over-Month (MoM) Stability
    // We compare previous periods to see if there's a recurring multiplier
    // For this skeleton, we calculate a "Seasonality Factor" based on 
    // variance between the last 2 snapshots vs their 6-month average.
    
    const latestInflow = historicalSnapshots[0]?.totalInflow || 0;
    const avgInflow = historicalSnapshots.reduce((sum, s) => sum + (s.totalInflow || 0), 0) / historicalSnapshots.length;
    
    // Seasonality Factor: How much current month usually deviates from average
    const factor = avgInflow > 0 ? (latestInflow / avgInflow) : 1.0;

    // 2. Generate Adjustment Days
    const forecastDays: ForecastDay[] = [];
    const baseDate = new Date(context.cashflowBaseline.snapshotTimestamp);

    for (let i = 1; i <= days; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        // We only flag seasonality impact in supportingData for the orchestrator to merge
        forecastDays.push({
            date: date.toISOString().split('T')[0],
            inflow: 0,
            outflow: 0,
            closingBalance: 0,
            isForecasted: true,
            confidence: 1.0,
            supportingData: { seasonalityFactor: Number(factor.toFixed(2)) }
        } as any);
    }

    return forecastDays;
  }
}
