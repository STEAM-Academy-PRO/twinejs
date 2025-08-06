import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { StoryService } from './story.service';
import {
  CreateStoryDto,
  Story,
  UpsertStoryDto,
} from './story.types';
import { AuthGuard } from '../auth/auth.guard';
import { publishStoryToWeb } from './publish';

@Controller('api/stories')
@UseGuards(AuthGuard)

export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get()
  async findAll(): Promise<Story[]> {
    const stories = await this.storyService.findAll();
    return stories.map(this.toResponse);
  }

  @Get('keys')
  async getAllKeys(): Promise<{ keys: string[] }> {
    const keys = await this.storyService.getAllKeys();
    return { keys };
  }

  @Get('sync-info')
  async getSyncInfo(): Promise<{ lastModified: string | null; count: number }> {
    const lastModified = await this.storyService.getLastModified();
    const stories = await this.storyService.findAll();
    return {
      lastModified: lastModified?.toISOString() || null,
      count: stories.length,
    };
  }

  @Get(':key')
  async findByKey(@Param('key') key: string): Promise<Story> {
    const story = await this.storyService.findByKey(key);
    if (!story) {
      throw new Error(`Story with key '${key}' not found`);
    }
    return this.toResponse(story);
  }

  @Post()
  async create(@Body() createDto: CreateStoryDto): Promise<Story> {
    const story = await this.storyService.create(createDto);
    return this.toResponse(story);
  }

  @Post('publish/:storyId')
  async publish(@Param('storyId') storyId: string, @Body() body: { source: string }): Promise<{ success: boolean; url: string }> {
    if (!body || !body.source) {
      throw new Error('Request body must contain a "source" field with the story HTML content');
    }

    console.log('Publishing story:', storyId);
    const url = await publishStoryToWeb(storyId, body.source);
    return {
      success: true,
      url
    };
  }

  @Put(':key')
  async upsert(
    @Param('key') key: string,
    @Body() updateOrCreateDto: UpsertStoryDto,
  ): Promise<Story> {
    return this.storyService.upsert(key, updateOrCreateDto);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('key') key: string): Promise<void> {
    await this.storyService.deleteByKey(key);
  }
  

  private toResponse(story: any): Story {
    return {
      id: story.id,
      key: story.key,
      data: story.data,
      lastModified: story.lastModified.toISOString(),
      createdBy: story.createdBy,
      version: story.version,
    };
  }
}
