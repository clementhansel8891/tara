import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../../../shared/audit/audit.service';

/**
 * HR Mutation Interceptor — logs all HR write operations to the audit trail.
 */
@Injectable()
export class HRMutationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HRMutationInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only intercept mutations
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();
    const user = request.user;

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditService.log({
            action_type: `${method} ${request.url}`,
            actor_id: user?.sub,
            actor_role: user?.role,
            target_entity_type: 'hr_mutation',
            action_context: request.headers['x-interface-origin'] || 'web',
            ip_address: request.ip,
            user_agent: request.headers['user-agent'],
          });
        },
        error: (err) => {
          this.logger.warn(`HR mutation failed: ${method} ${request.url} — ${err.message}`);
        },
      }),
    );
  }
}
