import {Story} from '../../../stories';
// import {publishStory, publishStoryWithFormat} from '../../../../util/publish';
import {
	formatWithNameAndVersion,
	StoryFormatsState
} from '../../../story-formats';
// import {getAppInfo} from '../../../../util/app-info';
// import {fetchStoryFormatProperties} from '../../../../util/story-format/fetch-properties';
import { BACKEND_SYNC_CONFIG } from '../backend-config';

/*
 * Story saving with HTML would be a couple of hundred KB each round trip
 * so it's easier just to fix it into export.
 */

async function saveStoryWithoutHtml (story: Story) {
    try {
      const response = await fetch(`${BACKEND_SYNC_CONFIG.baseUrl}/stories/${story.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(story)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.warn(`Failed to save story '${story.id}':`, error);
    }
  }


/**
 * Sends an IPC message to save a story to disk, ideally in published form.
 */
export async function saveStory(story: Story, formats: StoryFormatsState) {

	try {
		const format = formatWithNameAndVersion(
			formats,
			story.storyFormat,
			story.storyFormatVersion
		);

		if (format.loadState === 'loaded') {
			saveStoryWithoutHtml(
				story,
				// publishStoryWithFormat(story, format.properties.source, getAppInfo(), {
				// 	startOptional: true
				// })
			);
		} else {
			// const {source} = await fetchStoryFormatProperties(format.url);

			saveStoryWithoutHtml(
				story,
				// publishStoryWithFormat(story, source, getAppInfo(), {
				// 	startOptional: true
				// })
			);
		}
	} catch (error) {
		console.warn(
			`Could not save full story (${
				(error as Error).message
			}). Trying to save story data only.`
		);
		saveStoryWithoutHtml(
			story,
			// publishStory(story, getAppInfo(), {startOptional: true})
		);
	}
}
