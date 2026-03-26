import { Recommendation, RecommendationContext, RecommendationRule } from '../../types/recommendation.types';
import * as crypto from 'crypto';

export class ExpenseReductionRule implements RecommendationRule {
  readonly type = 'COST_REDUCTION';

  generate(context: RecommendationContext): Recommendation[] {
    const { insightContext, baselineForecast } = context;
    const isDeclining = insightContext.cashflow.projectionDetails[29].closingBalance < insightContext.cashflow.openingBalance;

    if (!isDeclining) return [];

    const totalOutflow = insightContext.cashflow.cashflowDrivers.outflow.reduce((sum: number, d: any) => sum + d.amount, 0);
    const potentialSaving = totalOutflow * 0.10; // 10% Target

    return [{
      id: crypto.createHash('sha256').update(`COST_CUT:${baselineForecast.forecastHash}`).digest('hex'),
      basedOnInsightId: '',
      type: 'COST_REDUCTION',
      action: `Implement 10% cross-departmental expense reduction to preserve ~${Math.round(potentialSaving).toLocaleString()} in monthly liquidity.`,
      expectedImpact: {
        cashDelta: Math.round(potentialSaving * 3), // 3-month impact
        runwayDeltaDays: 28,
        riskReduction: 0.65
      },
      confidence: 'MEDIUM',
      priorityScore: 6.5,
      constraints: ['Operational Efficiency Impact'],
      simulationHash: baselineForecast.forecastHash,
      explanation: {
        method: 'Expense Multiplier Simulation (0.90x)',
        assumptions: ['All non-committed expenses are reducible', 'No impact on revenue generation']
      }
    }];
  }
}
