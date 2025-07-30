import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Story, CreateStoryDto, UpdateStoryDto } from './story.types';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';


@Injectable()
export class StoryService {
  private readonly storiesDir = path.join(process.cwd(), 'persistence/stories');
  private readonly publicStoryDir = path.join(process.cwd(), 'public/stories');
  private keyToIdMap: Map<string, string> = new Map();
  private initialized = false;

  private async ensureStoriesDirectory(): Promise<void> {
    try {
      await fs.access(this.storiesDir);
    } catch {
      await fs.mkdir(this.storiesDir, { recursive: true });
    }
  }

  private async initializeKeyMap(): Promise<void> {
    // if (this.initialized) return;

    await this.ensureStoriesDirectory();

    try {
      const files = await fs.readdir(this.storiesDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.storiesDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const story: Story = JSON.parse(content);
          this.keyToIdMap.set(story.key, story.id);
        } catch (error) {
          console.warn(`Failed to load story from ${file}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to initialize key map:', error);
    }

    // this.initialized = true;
  }

  private getStoryFilePath(id: string): string {
    return path.join(this.storiesDir, `${id}.json`);
  }

  private async saveStoryToFile(story: Story): Promise<void> {
    const filePath = this.getStoryFilePath(story.id);
    const storyData = {
      ...story,
      lastModified: story.lastModified.toISOString(),
    };
    console.log('Saving story to file:', filePath);

    await fs.writeFile(filePath, JSON.stringify(storyData, null, 2), 'utf-8');

    // Persist HTML if exists to public folder under the ID:
    if (story.htmlSource) {
      const htmlFilePath = path.join(this.publicStoryDir, `${story.id}.html`);
      await fs.writeFile(htmlFilePath, story.htmlSource, 'utf-8');
    }
  }

  private async loadStoryFromFile(id: string): Promise<Story | null> {
    try {
      const filePath = this.getStoryFilePath(id);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return {
        ...data,
        lastModified: new Date(data.lastModified),
      };
    } catch {
      return null;
    }
  }

  private async deleteStoryFile(id: string): Promise<void> {
    try {
      const filePath = this.getStoryFilePath(id);
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Failed to delete story file ${id}:`, error);
    }
  }

  async findAll(): Promise<Story[]> {
    await this.initializeKeyMap();

    const stories: Story[] = [];
    for (const id of this.keyToIdMap.values()) {
      const story = await this.loadStoryFromFile(id);
      if (story) {
        stories.push(story);
      }
    }

    return stories;
  }

  async findByKey(key: string): Promise<Story | null> {
    await this.initializeKeyMap();

    const id = this.keyToIdMap.get(key);
    if (!id) return null;

    return await this.loadStoryFromFile(id);
  }

  async findById(id: string): Promise<Story | null> {
    await this.initializeKeyMap();
    return await this.loadStoryFromFile(id);
  }

  async create(createDto: CreateStoryDto): Promise<Story> {
    await this.initializeKeyMap();

    // Check if key already exists
    if (this.keyToIdMap.has(createDto.key)) {
      throw new ConflictException(`Story with key '${createDto.key}' already exists`);
    }

    const id = uuidv4();
    const story: Story = {
      id,
      key: createDto.key,
      data: createDto.data,
      lastModified: new Date(),
      createdBy: createDto.createdBy,
      version: 1,
    };

    await this.saveStoryToFile(story);
    this.keyToIdMap.set(createDto.key, id);

    return story;
  }

  async updateByKey(key: string, updateDto: UpdateStoryDto): Promise<Story> {
    await this.initializeKeyMap();

    const existingStory = await this.findByKey(key);
    if (!existingStory) {
      throw new NotFoundException(`Story with key '${key}' not found`);
    }

    // Optimistic locking check
    if (existingStory.version !== updateDto.version) {
      throw new ConflictException(
        `Version mismatch. Expected ${existingStory.version}, got ${updateDto.version}`
      );
    }

    const updatedStory: Story = {
      ...existingStory,
      data: updateDto.data ?? existingStory.data,
      lastModified: new Date(),
      version: existingStory.version + 1,
    };

    await this.saveStoryToFile(updatedStory);
    return updatedStory;
  }

  async upsert(key: string, data: any, expectedVersion?: number): Promise<Story> {
    await this.initializeKeyMap();

    const existingStory = await this.findByKey(key);

    if (existingStory) {
      // Update existing story
      if (expectedVersion !== undefined && existingStory.version !== expectedVersion) {
        throw new ConflictException(
          `Version mismatch. Expected ${expectedVersion}, got ${existingStory.version}`
        );
      }

      const updatedStory: Story = {
        ...existingStory,
        data,
        lastModified: new Date(),
        version: existingStory.version + 1,
      };

      await this.saveStoryToFile(updatedStory);
      return updatedStory;
    } else {
      // Create new story
      const id = data.id || uuidv4();
      const story: Story = {
        id,
        key,
        data,
        lastModified: new Date(),
        version: 1,
      };

      await this.saveStoryToFile(story);
      this.keyToIdMap.set(key, id);
      return story;
    }
  }

  async deleteByKey(key: string): Promise<void> {
    await this.initializeKeyMap();

    const id = this.keyToIdMap.get(key);
    if (!id) {
      throw new NotFoundException(`Story with key '${key}' not found`);
    }

    await this.deleteStoryFile(id);
    this.keyToIdMap.delete(key);
  }

  async getAllKeys(): Promise<string[]> {
    await this.initializeKeyMap();
    return Array.from(this.keyToIdMap.keys());
  }

  async getLastModified(): Promise<Date | null> {
    const stories = await this.findAll();
    if (stories.length === 0) return null;

    return stories.reduce((latest, story) =>
      story.lastModified > latest ? story.lastModified : latest,
      new Date(0)
    );
  }
}
