import { BACKEND_SYNC_CONFIG } from "../backend-config";


export async function get(id: string): Promise<string> {
	const res = await fetch(`${BACKEND_SYNC_CONFIG.baseUrl}/scenes/${id}`);
	if (!res.ok) {
		throw new Error(`Failed to get scene '${id}': HTTP ${res.status}`);
	}
	return await res.text();
}
