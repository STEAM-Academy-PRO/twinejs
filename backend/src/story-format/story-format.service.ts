import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StoryFormatService {
  private readonly storyFormatsDir = path.join(process.cwd(), 'persistence');
  private readonly storyFormatsFile = path.join(this.storyFormatsDir, 'story-formats.json');

  private async ensureStoryFormatsDirectory(): Promise<void> {
    try {
      await fs.access(this.storyFormatsDir);
    } catch {
      await fs.mkdir(this.storyFormatsDir, { recursive: true });
    }
  }

  async load(): Promise<any> {
    await this.ensureStoryFormatsDirectory();
    
    try {
      const content = await fs.readFile(this.storyFormatsFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      // Return empty array if file doesn't exist
      return [];
    }
  }

  async save(data: any): Promise<void> {
    await this.ensureStoryFormatsDirectory();
    await fs.writeFile(this.storyFormatsFile, JSON.stringify(data, null, 2), 'utf-8');
  }
}
