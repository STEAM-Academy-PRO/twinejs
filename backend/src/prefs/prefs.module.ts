import { Module } from '@nestjs/common';
import { PrefsController } from './prefs.controller';
import { PrefsService } from './prefs.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [PrefsController],
  providers: [PrefsService, AuthService],
  exports: [PrefsService],
})
export class PrefsModule {}
