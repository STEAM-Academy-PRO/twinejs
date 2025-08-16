import { Module } from '@nestjs/common';
import { SceneController } from './scene.controller';

@Module({
  controllers: [SceneController],
})
export class SceneModule {}
