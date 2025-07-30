import {
	StoriesAction,
	StoriesState,
	storyWithId,
	storyWithName
} from '../../../stories';
import {StoryFormatsState} from '../../../story-formats';
import {
	isPersistablePassageChange,
	isPersistableStoryChange
} from '../../persistable-changes';
import { BACKEND_SYNC_CONFIG } from '../backend-config';
import {saveStory} from './save-story';

// When a story is deleted, we need to be able to look up information about it
// from the last state.

let lastState: StoriesState;

async function deleteStory(storyId: string) {
    try {
      const response = await fetch(`${BACKEND_SYNC_CONFIG.baseUrl}/stories/${storyId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.warn(`Failed to delete story '${storyId}':`, error);
    }
  }

/**
 * A middleware function to save changes to disk. This should be called *after*
 * the main reducer runs.
 *
 * This has an extra argument: functions to archive and publish a story. This is
 * because the Electron app saves stories in published format.
 */
export function saveMiddleware(
	state: StoriesState,
	action: StoriesAction,
	formats: StoryFormatsState
) {

	switch (action.type) {
		case 'init':
		case 'repair':
			// We take no action here on a repair action. This is to prevent messing up a
			// story's last modified date. If the user then edits the story, we'll save
			// their change and the repair then.
			break;

		case 'createStory':
			if (!action.props.name) {
				throw new Error('Passage was created but with no name specified');
			}

			saveStory(storyWithName(state, action.props.name), formats);
			break;

		case 'deleteStory': {
			// We have to look up the story in our saved last state to know what file
			// to delete.

			deleteStory(storyWithId(lastState, action.storyId).id);
			break;
		}

		case 'updateStory':
			if (isPersistableStoryChange(action.props)) {
				saveStory(storyWithId(state, action.storyId), formats);
			}
			break;

		case 'createPassage':
		case 'createPassages':
		case 'deletePassage':
		case 'deletePassages':
			saveStory(storyWithId(state, action.storyId), formats);
			break;

		case 'updatePassage':
			// Skip updates that wouldn't be saved.
			if (isPersistablePassageChange(action.props)) {
				saveStory(storyWithId(state, action.storyId), formats);
			}
			break;

		case 'updatePassages':
			// Skip updates that wouldn't be saved.
			if (
				Object.keys(action.passageUpdates).some(passageId =>
					isPersistablePassageChange(action.passageUpdates[passageId])
				)
			) {
				saveStory(storyWithId(state, action.storyId), formats);
			}
			break;

		default:
			console.warn(
				`Story action ${
					(action as any).type
				} has no Electron persistence handler`
			);
	}

	lastState = [...state];
}
