
export interface BackendSyncConfig {
    baseUrl: string;
    enabled: boolean;
    syncOnLoad: boolean;
    blockUntilSynced: boolean;
    syncIntervalMs: number;
  }


export const BACKEND_SYNC_CONFIG: BackendSyncConfig = {
    baseUrl: '/api',
    enabled: true,
    syncOnLoad: true,
    blockUntilSynced: true,
    syncIntervalMs: 1000, // 1 seconds
  };