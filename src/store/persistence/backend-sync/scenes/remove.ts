import { BACKEND_SYNC_CONFIG } from '../backend-config';

export async function remove(id: string): Promise<void> {
  const res = await fetch(`${BACKEND_SYNC_CONFIG.baseUrl}/scenes/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete scene '${id}': HTTP ${res.status}`);
  }
}
