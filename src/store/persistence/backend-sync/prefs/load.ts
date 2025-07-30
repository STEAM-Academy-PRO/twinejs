import {PrefsState} from '../../../prefs';
import {defaults} from '../../../prefs/defaults';
import { BACKEND_SYNC_CONFIG } from '../backend-config';

async function getAllPrefs(): Promise<any[]> {
    try {
      const response = await fetch(`${BACKEND_SYNC_CONFIG.baseUrl}/prefs`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch prefs:', error);
      return [];
    }
  }

export async function load(): Promise<Partial<PrefsState>> {
	const result: Partial<PrefsState> = {};
	const prefKeys = Object.keys(defaults());

	const prefs = await getAllPrefs();

	if (prefs && typeof prefs === 'object') {
		for (const key in prefs) {
			if (prefKeys.includes(key)) {
				(result as any)[key] = prefs[key];
			}
		}
	}

	return result;
}
