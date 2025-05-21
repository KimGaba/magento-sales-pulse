
import { SyncProgress } from './database';

// Export SyncProgress from this file so components can import from either location
export type { SyncProgress };

export interface SyncHistoryItem {
  id: string;
  timestamp: Date;
  status: 'success' | 'error';
  itemsSynced: number;
  duration: number;
  trigger: 'manual' | 'scheduled';
}
