import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../../shared/audit/audit.service';
import { LoggerService } from '../../../shared/logger/logger.service';

/**
 * HRMutationInterceptor
 * Automatically captures ALL HR mutations (POST, PUT, PATCH, DELETE)
 * for dual-logging to AuditStore and SystemLog.
 */
@Injectable()
export class HRMutationInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HRMutationInterceptor');

  constructor(
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path, body, headers } = request;
    const tenantId = headers['x-tenant-id'] || body.tenantId;
    const userId = headers['x-user-id'] || 'system';

    // Only intercept mutations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap({
          next: async (data) => {
            const entityId = data?.id || body?.id || 'n/a';
            const entityType = this.extractEntityType(path);

            // 1. Audit Logging (Compliance Trace)
            try {
              await this.auditService.log({
                tenantId,
                userId,
                module: 'HR',
                action: method === 'POST' ? 'CREATE' : method === 'DELETE' ? 'DELETE' : 'UPDATE',
                entityType,
                entityId,
                metadata: {
                  path,
                  method,
                  payload: body,
                },
              });
            } catch (err) {
              this.logger.error(`Audit logging failed: ${err.message}`);
            }

            // 2. System Logging (Observability)
            try {
              await this.loggerService.log({
                tenantId,
                module: 'HR',
                level: 'INFO',
                event: `HR_${method}_MUTATION`,
                message: `HR Mutation: ${method} ${path} by ${userId}`,
                payload: {
                  entityType,
                  entityId,
                  status: 'SUCCESS',
                },
                userId,
              });
            } catch (err) {
              this.logger.error(`System logging failed: ${err.message}`);
            }
          },
          error: async (err) => {
             // Log failures too
             await this.loggerService.log({
                tenantId,
                module: 'HR',
                level: 'ERROR',
                event: `HR_${method}_FAILURE`,
                message: `HR Mutation Failed: ${method} ${path} - ${err.message}`,
                payload: { body, error: err.message },
                userId,
                errorStack: err.stack,
              });
          }
        }),
      );
    }

    return next.handle();
  }

  private extractEntityType(path: string): string {
    const segments = path.split('/').filter(s => s && s !== 'api' && s !== 'hr');
    return segments[0]?.toUpperCase() || 'UNKNOWN';
  }
}
