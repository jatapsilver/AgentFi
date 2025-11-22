import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new NotImplementedException('Server configuration is incorrect');
    }
    try {
      const payload = this.jwtService.verify(token, { secret });

      payload.exp = new Date(payload.exp * 1000);

      payload.iat = new Date(payload.iat * 1000);

      if (!payload.role) {
        throw new UnauthorizedException(
          'You do not have the necessary permissions',
        );
      }
      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('The token has expired');
      }
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Authentication error');
    }
  }
}
