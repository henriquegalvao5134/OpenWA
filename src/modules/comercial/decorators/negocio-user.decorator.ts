import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { NEGOCIO_USER_KEY } from '../guards/jwt-negocio.guard';
import type { JwtNegocioPayload } from '../auth-negocio.service';

export const NegocioUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtNegocioPayload => {
    const req = ctx.switchToHttp().getRequest();
    return req[NEGOCIO_USER_KEY] as JwtNegocioPayload;
  },
);
