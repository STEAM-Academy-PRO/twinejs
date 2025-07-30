import {StoryFormatsAction, StoryFormatsState} from '../../../story-formats';
import {isPersistableStoryFormatChange} from '../../persistable-changes';

import { BACKEND_SYNC_CONFIG } from '../backend-config';

async function saveAllStoryFormats(state: any[]) {
    try {
        const response = await fetch(`${BACKEND_SYNC_CONFIG.baseUrl}/story-formats`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(state)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
        console.warn(`Failed to save story formats:`, error);
    }
}

/**
 * A middleware function to save changes to disk. This should be called
 * *after* the main reducer runs.
 */
export function saveMiddleware(
	state: StoryFormatsState,
	action: StoryFormatsAction
) {
	const shouldSave =
		action.type === 'create' ||
		action.type === 'delete' ||
		action.type === 'repair' ||
		(action.type === 'update' && isPersistableStoryFormatChange(action.props));

	if (shouldSave) {
		saveAllStoryFormats(
			state.map(format => ({
				id: format.id,
				name: format.name,
				selected: undefined,
				version: format.version,
				url: format.url,
				userAdded: format.userAdded
			}))
		);
	}
}
