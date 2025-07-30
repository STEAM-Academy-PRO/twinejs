import {StoryFormatsState} from '../../../story-formats/story-formats.types';
import { BACKEND_SYNC_CONFIG } from '../backend-config';

async function getAllStoryFormats(): Promise<any[]> {
    try {
      const response = await fetch(`${BACKEND_SYNC_CONFIG.baseUrl}/story-formats`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch story formats:', error);
      return [];
    }
  }

export async function load(): Promise<StoryFormatsState> {
	const storyFormats = await getAllStoryFormats();

	if (!storyFormats) {
		return [];
	}

	return storyFormats;
}
