import { BACKEND_SYNC_CONFIG } from '../backend-config';

export interface UpsertResult {
  id: string;
  url: string; // API URL to fetch the SVG
  size?: number;
}

export async function upsertFromFile(svg: string, id?: string): Promise<UpsertResult> {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const formData = new FormData();
  formData.append('file', blob, id ?? '');
  formData.append('id', id ?? '');
  const res = await fetch(`${BACKEND_SYNC_CONFIG.baseUrl}/scenes/upsert`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Failed to upsert scene: HTTP ${res.status}`);
  const data = await res.json();
  return { id: data.id, url: data.path, size: data.size };
}

