import { Module } from '@nestjs/common';
import { StoryFormatController } from './story-format.controller';
import { StoryFormatService } from './story-format.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [StoryFormatController],
  providers: [StoryFormatService, AuthService],
  exports: [StoryFormatService],
})
export class StoryFormatModule {}
