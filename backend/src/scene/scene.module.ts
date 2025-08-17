import { Module } from '@nestjs/common';
import { SceneController } from './scene.controller';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [SceneController],
  providers: [AuthService]
})
export class SceneModule {}
