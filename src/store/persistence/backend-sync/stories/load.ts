import {Story} from '../../../stories/stories.types';
import {importStories} from '../../../../util/import';
import { BACKEND_SYNC_CONFIG } from '../backend-config';


async function getAllStories(): Promise<any[]> {
    try {
      const response = await fetch(`${BACKEND_SYNC_CONFIG.baseUrl}/stories`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch stories:', error);
      return [];
    }
  }

export async function load(): Promise<Story[]> {
	const stories = await getAllStories()

	if (stories && Array.isArray(stories)) {
		// return stories.reduce((result, file) => {
		// 	const story = importStories(file.htmlSource, file.mtime);

		// 	if (story[0]) {
		// 		return [...result, story[0]];
		// 	}

		// 	console.warn('Could not hydrate story: ', file.htmlSource);
		// 	return result;
		// }, [] as Story[]);
		// ---------------------------------------- <- Still have to understand how HTML is used!
		return stories.map(story => story.data)
	} else {
		console.warn('No stories to hydrate in Electron bridge');
	}

	return [];
}
