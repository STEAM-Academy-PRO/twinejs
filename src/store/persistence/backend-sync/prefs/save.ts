import {PrefsState} from '../../../prefs';
import { BACKEND_SYNC_CONFIG } from '../backend-config';

export async function save(state: PrefsState) {
    try {
      const response = await fetch(`${BACKEND_SYNC_CONFIG.baseUrl}/prefs`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(state)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.warn(`Failed to save prefs:`, error);
    }
  }

