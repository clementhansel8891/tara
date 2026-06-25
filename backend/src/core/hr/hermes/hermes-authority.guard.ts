import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HermesAuthorityLevel } from './hermes.interfaces';
import { HermesAgentContext } from './hermes-api-key.guard';

/**
 * Metadata key for required authority level on endpoints.
 */
export const HERMES_AUTHORITY_KEY = 'hermes_authority';

/**
 * Decorator: marks the minimum authority level required for an endpoint.
 *
 * Usage: @RequiresAuthority('read_write')
 */
export const RequiresAuthority = (level: HermesAuthorityLevel) =>
  SetMetadata(HERMES_AUTHORITY_KEY, level);

/**
 * Authority hierarchy for comparison.
 * Higher index = more permissive.
 */
const AUTHORITY_HIERARCHY: HermesAuthorityLevel[] = [
  'read_only',
  'read_write',
  'full_autonomous',
];

/**
 * Hermes Authority Guard
 *
 * Checks that the resolved Hermes agent (from HermesApiKeyGuard) has
 * sufficient authority for the decorated endpoint.
 *
 * Must be used AFTER HermesApiKeyGuard in the guard chain.
 *
 * Usage: @UseGuards(HermesApiKeyGuard, HermesAuthorityGuard)
 */
@Injectable()
export class HermesAuthorityGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAuthority = this.reflector.getAllAndOverride<HermesAuthorityLevel>(
      HERMES_AUTHORITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no authority decorator is set, default to read_only (safest)
    if (!requiredAuthority) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const agent: HermesAgentContext = request.hermesAgent;

    if (!agent) {
      throw new ForbiddenException('No Hermes agent context found — ensure HermesApiKeyGuard runs first');
    }

    const requiredIndex = AUTHORITY_HIERARCHY.indexOf(requiredAuthority);
    const agentIndex = AUTHORITY_HIERARCHY.indexOf(agent.authority_level);

    if (agentIndex < requiredIndex) {
      throw new ForbiddenException(
        `Hermes agent '${agent.name}' has authority '${agent.authority_level}' but '${requiredAuthority}' is required`,
      );
    }

    return true;
  }
}
