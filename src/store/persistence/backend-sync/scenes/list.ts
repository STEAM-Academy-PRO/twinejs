import { BACKEND_SYNC_CONFIG } from '../backend-config';

export interface SceneSummary {
  id: string;
  url: string; // API URL to fetch the SVG
}

export async function list(ids?: string[]): Promise<SceneSummary[]> {
  try {
    const query = ids && ids.length ? `?ids=${ids.join(',')}` : '';
    const res = await fetch(`${BACKEND_SYNC_CONFIG.baseUrl}/scenes${query}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: Array<{ id: string; path: string }> = await res.json();
    return data.map(it => ({ id: it.id, url: it.path }));
  } catch (e) {
    console.warn('Failed to list scenes:', e);
    return [];
  }
}
