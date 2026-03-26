import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from './tenant-context.interface';

export const TenantCtx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantContext;
  },
);
