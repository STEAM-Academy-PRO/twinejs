import * as React from 'react';
import * as prefs from './prefs';
import * as stories from './stories';
import * as storyFormats from './story-formats';
import * as scenes from './scenes';

export function useBackendSyncPersistence() {
	return React.useMemo(
		() => ({
			prefs: {
				load: prefs.load,
				saveMiddleware: prefs.saveMiddleware
			},
			stories: {
				load: stories.load,
				saveMiddleware: stories.saveMiddleware
			},
			storyFormats: {
				load: storyFormats.load,
				saveMiddleware: storyFormats.saveMiddleware
			},
			scenes: {
				list: scenes.list,
				save: scenes.save,
				get: scenes.get,
				remove: scenes.remove,
			}
		}),
		[]
	);
}
