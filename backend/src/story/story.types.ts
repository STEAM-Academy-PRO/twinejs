export interface Story {
  id: string;
  key: string; // User-defined key for the story
  data: any; // The actual story data (Story object from frontend)
  htmlSource?: string;
  lastModified: Date;
  createdBy?: string; // Optional user identification
  version: number; // For conflict resolution
}

export interface CreateStoryDto {
  key: string;
  data: any;
  createdBy?: string;
}

export interface UpdateStoryDto {
  data: Partial<Story>;
  version: number; // Required for optimistic locking
}

export interface UpsertStoryDto {
  data: Story;
  expectedVersion?: number; // Optional for conflict detection
}

export interface StoryResponse {
  id: string;
  key: string;
  data: any;
  lastModified: string;
  createdBy?: string;
  version: number;
}
