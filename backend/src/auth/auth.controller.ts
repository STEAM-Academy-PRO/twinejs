import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    if (req.user?.sessionId) {
      this.authService.removeSession(req.user.sessionId);
    }
    res.clearCookie('session');
    res.json({ message: 'Logged out successfully' });
  }

  @Post('status')
  @UseGuards(AuthGuard)
  status(@Req() req: AuthenticatedRequest) {
    return {
      authenticated: true,
      username: req.user?.username,
    };
  }
}
