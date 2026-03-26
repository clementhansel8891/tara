import { Insight } from './insight.types';

export type InsightSnapshot = {
  id: string; // sha256(snapshotSequence + forecastHash + insightHash)
  tenantId: string;
  companyId: string;
  snapshotSequence: number;
  source: 'ACTUAL' | 'FORECAST';
  forecastHash?: string;
  insights: Insight[];
  insightHash: string; // sha256(stableSerialize(insights))
  createdAt: Date;
};
