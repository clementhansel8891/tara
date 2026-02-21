import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContext } from './tenant-context.interface';

/**
 * Tenant Interceptor
 * Extracts tenant context from request headers and attaches to request object
 * Enforces multi-tenancy by requiring x-tenant-id header
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Extract tenant ID from header (required)
    const tenantId = request.headers['x-tenant-id'];
    
    if (!tenantId) {
      throw new BadRequestException(
        'Missing required header: x-tenant-id. All requests must include a tenant identifier.',
      );
    }

    // Extract valid headers
    const locationId = request.headers['x-location-id'];
    const userId = request.headers['x-actor-id'];
    const role = request.headers['x-user-role'];

    // Attach tenant context to request object
    const tenantContext: TenantContext = {
      tenantId: tenantId as string,
      locationId: locationId as string | undefined,
      userId: userId as string | undefined,
      role: role as string | undefined,
    };

    request.tenantContext = tenantContext;

    return next.handle();
  }
}
