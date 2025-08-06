import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller('stories')
export class StaticController {

  @Get(':id')
  async serveStoryIndex(
    @Param('id') storyId: string,
    @Res() res: Response,
  ) {
    const publicDir = join(__dirname, '..', '..', 'public');
    const storyDir = join(publicDir, 'stories', storyId);
    const indexFile = join(storyDir, 'index.html');
    console.log('serving story: ' + storyId + ' from ' + indexFile)

    if (existsSync(indexFile)) {
      return res.sendFile(indexFile);
    }

    throw new NotFoundException(`Story ${storyId} not found`);
  }
}
