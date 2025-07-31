import { Module } from '@nestjs/common';
import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [StoryController],
  providers: [StoryService, AuthService],
  exports: [StoryService],
})
export class StoryModule {}
