import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Context filter interceptor — applies data filtering based on interface origin.
 * HR_Team via Web = Administrative (all data)
 * Everyone via Mobile = Personal Employee (own data only)
 */
@Injectable()
export class TaraContextFilterInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const interfaceOrigin = request.headers['x-interface-origin'] || 'web';

    // Attach context to request
    request.taraContext = {
      isAdministrative: (user?.role === 'HR_Admin' || user?.role === 'SuperAdmin') && interfaceOrigin === 'web',
      interfaceOrigin,
      userId: user?.sub,
      role: user?.role,
    };

    return next.handle();
  }
}
