import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService, AuthUser } from './auth.service';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    // First, check if user has a valid session cookie
    const sessionId = request.cookies?.['session'];
    if (sessionId) {
      const user = this.authService.validateSession(sessionId);
      if (user) {
        request.user = user;
        return true;
      }
      // Invalid session, clear the cookie
      response.clearCookie('session');
    }

    // No valid session, check for Basic Auth
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      // No auth provided, request Basic Auth
      response.setHeader('WWW-Authenticate', 'Basic realm="Twine Admin"');
      throw new UnauthorizedException('Authentication required');
    }

    // Parse Basic Auth credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (!this.authService.validateUser(username, password)) {
      response.setHeader('WWW-Authenticate', 'Basic realm="Twine Admin"');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Valid credentials, create session and set cookie
    const newSessionId = this.authService.createSession(username);
    response.cookie('session', newSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    request.user = { username, sessionId: newSessionId };
    return true;
  }
}
