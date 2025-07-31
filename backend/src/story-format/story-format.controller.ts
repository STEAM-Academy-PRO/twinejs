import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { StoryFormatService } from './story-format.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('story-formats')
@UseGuards(AuthGuard)

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
