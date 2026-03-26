import { InsightContext } from './insight.types';
import { ForecastOutput } from './forecast.types';

export type RecommendationType = 
  | 'PAYMENT_OPTIMIZATION' 
  | 'COLLECTION_ACCELERATION' 
  | 'COST_REDUCTION' 
  | 'LIQUIDITY_BUFFER';

export type Recommendation = {
  id: string; // sha256(basedOnInsightId + simulationHash + stableSerialize(action))
  basedOnInsightId: string;
  type: RecommendationType;

  action: string;
  expectedImpact: {
    cashDelta: number;
    runwayDeltaDays: number;
    riskReduction: number; // 0.0 - 1.0
  };

  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  priorityScore: number;

  constraints: string[];

  simulationHash: string; // SHA-256 of the specific forecast run used for validation

  explanation: {
    method: string;
    assumptions: string[];
  };
};

export type RecommendationContext = {
  insightContext: InsightContext;
  baselineForecast: ForecastOutput;
  simulationResults?: {
    actionId: string;
    forecast: ForecastOutput;
    delta: {
      cashDelta: number;
      runwayDeltaDays: number;
    };
  }[];
};

export interface RecommendationRule {
    readonly type: string;
    generate(context: RecommendationContext): Recommendation[];
}
