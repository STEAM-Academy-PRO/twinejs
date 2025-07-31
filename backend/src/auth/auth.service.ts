import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

export interface AuthUser {
  username: string;
  sessionId: string;
}

@Injectable()
export class AuthService {
  // In a real app, store these in a database or environment variables
  private readonly users = new Map([
    ['steam', this.hashPassword('therewillbecake')],
  ]);

  // Store active sessions (in production, use Redis or database)
  private readonly sessions = new Map<string, AuthUser>();

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  validateUser(username: string, password: string): boolean {
    const hashedPassword = this.hashPassword(password);
    return this.users.get(username) === hashedPassword;
  }

  createSession(username: string): string {
    const sessionId = randomBytes(32).toString('hex');
    this.sessions.set(sessionId, { username, sessionId });
    return sessionId;
  }

  validateSession(sessionId: string): AuthUser | null {
    return this.sessions.get(sessionId) || null;
  }

  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
