import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthNegocioService, JwtNegocioPayload } from '../auth-negocio.service';

export const NEGOCIO_USER_KEY = 'negocioUser';

@Injectable()
export class JwtNegocioGuard implements CanActivate {
  constructor(private readonly authService: AuthNegocioService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de acesso necessário');
    }
    const token = authHeader.slice(7);
    const payload: JwtNegocioPayload = this.authService.verifyToken(token);
    // Attach to request for downstream use
    (req as unknown as Record<string, unknown>)[NEGOCIO_USER_KEY] = payload;
    return true;
  }
}
