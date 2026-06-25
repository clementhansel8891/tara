/**
 * Hermes Module (Barrel file)
 *
 * All Hermes providers and controllers are registered directly in HrModule
 * to avoid NestJS DI scope issues (Hermes services depend on NotificationService,
 * EventBusService, HermesIntegrationService which are sibling providers in HrModule).
 *
 * This file is kept for documentation and as a reference of what constitutes
 * the Hermes integration subsystem.
 *
 * Components:
 * - Guards: HermesApiKeyGuard, HermesAuthorityGuard, HermesRateLimitGuard
 * - Controllers: HermesActionController, HermesSuggestionController, HermesEventsController
 * - Services: HermesSafetyService, HermesAuditService, HermesSuggestionService
 * - Executors: HermesNotificationExecutor, HermesFollowUpExecutor, HermesQueryExecutor
 * - Processor: HermesFollowUpProcessor (cron-based scheduled delivery)
 */
export { HermesApiKeyGuard } from './hermes-api-key.guard';
export { HermesAuthorityGuard, RequiresAuthority } from './hermes-authority.guard';
export { HermesRateLimitGuard } from './hermes-rate-limit.guard';
export { HermesSafetyService } from './hermes-safety.service';
export { HermesAuditService } from './hermes-audit.service';
export { HermesSuggestionService } from './hermes-suggestion.service';
export { HermesFollowUpProcessor } from './hermes-followup.processor';
export { HermesNotificationExecutor } from './executors/notification.executor';
export { HermesFollowUpExecutor } from './executors/follow-up.executor';
export { HermesQueryExecutor } from './executors/query.executor';
export { HermesActionController } from './hermes-action.controller';
export { HermesSuggestionController } from './hermes-suggestion.controller';
export { HermesEventsController } from './hermes-events.controller';
export { HERMES_ACTION_CATALOG } from './hermes-action.catalog';
export * from './hermes.interfaces';
