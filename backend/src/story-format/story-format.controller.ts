import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StoryFormatService } from './story-format.service';

@Controller('story-formats')
export class StoryFormatController {
  constructor(private readonly storyFormatService: StoryFormatService) {}

  @Get()
  async load(): Promise<any> {
    return await this.storyFormatService.load();
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async save(@Body() data: any): Promise<void> {
    await this.storyFormatService.save(data);
  }
}
