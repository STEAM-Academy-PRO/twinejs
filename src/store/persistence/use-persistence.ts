// import * as React from 'react';
// import {useElectronIpcPersistence} from './electron-ipc/use-electron-ipc-persistence';
// import {useLocalStoragePersistence} from './local-storage/use-local-storage-persistence';
import {useBackendSyncPersistence} from './backend-sync/use-backend-sync-persistence';
// import {isElectronRenderer} from '../../util/is-electron';
import {StoriesAction, StoriesState} from '../stories';
import {StoryFormatsAction, StoryFormatsState} from '../story-formats';
import {PrefsAction, PrefsState} from '../prefs';

export interface PersistenceHooks {
	prefs: {
		load: () => Promise<Partial<PrefsState>>;
		saveMiddleware: (state: PrefsState, action: PrefsAction) => void;
	};
	stories: {
		load: () => Promise<StoriesState>;
		saveMiddleware: (
			state: StoriesState,
			action: StoriesAction,
			formats: StoryFormatsState
		) => void;
	};
	storyFormats: {
		load: () => Promise<StoryFormatsState>;
		saveMiddleware: (
			state: StoryFormatsState,
			action: StoryFormatsAction
		) => void;
	};
	scenes?: {
		list: (ids?: string[]) => Promise<Array<{ id: string; url: string }>>;
		save: (file: string, id?: string) => Promise<{ id: string; url: string; size?: number }>;
		get: (id: string) => Promise<string>;
		remove: (id: string) => Promise<void>;
	};
}

export function usePersistence(): PersistenceHooks {
	// const electronIpcPersistence = useElectronIpcPersistence();
	// const localStoragePersistence = useLocalStoragePersistence();


	// Wrap with backend sync functionality
	const backendSyncPersistence = useBackendSyncPersistence();

	return backendSyncPersistence;
}
