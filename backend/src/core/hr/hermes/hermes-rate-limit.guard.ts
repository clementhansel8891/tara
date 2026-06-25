import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HermesAgentContext } from './hermes-api-key.guard';
import { DEFAULT_SAFETY_CONFIG } from './hermes.interfaces';

/**
 * In-memory rate-limit tracker per agent.
 * In production, replace with Redis for multi-instance deployments.
 */
interface RateBucket {
  /** Timestamps of actions within the current window */
  timestamps: number[];
}

/**
 * Hermes Rate Limit Guard
 *
 * Prevents runaway LLM loops from flooding TARA with actions.
 * Tracks actions per agent per hour using a sliding window.
 *
 * Limits (configurable via DEFAULT_SAFETY_CONFIG):
 * - max_actions_per_agent_per_hour: 60 (default)
 *
 * Usage: @UseGuards(HermesApiKeyGuard, HermesRateLimitGuard)
 */
@Injectable()
export class HermesRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(HermesRateLimitGuard.name);
  private readonly buckets = new Map<string, RateBucket>();
  private readonly windowMs = 60 * 60 * 1000; // 1 hour

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const agent: HermesAgentContext | undefined = request.hermesAgent;

    if (!agent) {
      // No agent context means HermesApiKeyGuard didn't run or it's a non-hermes call
      return true;
    }

    const now = Date.now();
    const bucket = this.getOrCreateBucket(agent.id);

    // Prune timestamps outside the window
    bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < this.windowMs);

    const limit = DEFAULT_SAFETY_CONFIG.max_actions_per_agent_per_hour;

    if (bucket.timestamps.length >= limit) {
      this.logger.warn(
        `Rate limit exceeded for Hermes agent '${agent.name}' (${agent.id}): ${bucket.timestamps.length}/${limit} actions/hour`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Rate limit exceeded: max ${limit} actions per hour per agent`,
          retry_after_seconds: this.getRetryAfterSeconds(bucket),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Record this action
    bucket.timestamps.push(now);
    return true;
  }

  private getOrCreateBucket(agentId: string): RateBucket {
    if (!this.buckets.has(agentId)) {
      this.buckets.set(agentId, { timestamps: [] });
    }
    return this.buckets.get(agentId)!;
  }

  private getRetryAfterSeconds(bucket: RateBucket): number {
    if (bucket.timestamps.length === 0) return 0;
    const oldest = bucket.timestamps[0];
    const expiresAt = oldest + this.windowMs;
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
  }
}
