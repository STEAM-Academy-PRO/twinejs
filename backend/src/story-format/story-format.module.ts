import { Module } from '@nestjs/common';
import { StoryFormatController } from './story-format.controller';
import { StoryFormatService } from './story-format.service';

@Module({
  controllers: [StoryFormatController],
  providers: [StoryFormatService],
  exports: [StoryFormatService],
})
export class StoryFormatModule {}
