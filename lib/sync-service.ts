// lib/sync-service.ts
import { offlineDb, type OfflineTimeEntry, type SyncQueue } from "./offline-db";
import type { ServerStudy, ServerTimeEntry, SyncStatus } from "./types";

export class SyncService {
  private syncInProgress = false;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    // Listen for online events
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.syncWhenOnline());

      // Periodic sync when online
      setInterval(() => {
        if (navigator.onLine && !this.syncInProgress) {
          this.syncPendingData();
        }
      }, 30000); // Every 30 seconds
    }
  }

  private async syncWhenOnline() {
    if (navigator.onLine) {
      console.log("Connection restored, starting sync...");
      await this.syncPendingData();
    }
  }

  async syncPendingData(): Promise<boolean> {
    if (this.syncInProgress) {
      console.log("Sync already in progress");
      return false;
    }

    this.syncInProgress = true;

    try {
      const pendingItems = await offlineDb.getPendingSyncItems();
      console.log(`Found ${pendingItems.length} items to sync`);

      for (const item of pendingItems) {
        if (item.retryCount >= this.maxRetries) {
          console.warn(`Max retries reached for item ${item.id}, skipping`);
          await offlineDb.markSyncItemCompleted(item.id!);
          continue;
        }

        try {
          await this.syncItem(item);
          await offlineDb.markSyncItemCompleted(item.id!);
          console.log(`Successfully synced item ${item.id}`);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          await offlineDb.incrementSyncRetry(item.id!);

          // Wait before next retry
          await this.delay(this.retryDelay * (item.retryCount + 1));
        }
      }

      return true;
    } catch (error) {
      console.error("Sync failed:", error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: SyncQueue) {
    switch (item.table) {
      case "timeEntry":
        return await this.syncTimeEntry(item);
      default:
        throw new Error(`Unknown table: ${item.table}`);
    }
  }

  private async syncTimeEntry(item: SyncQueue) {
    const { action, data, recordId } = item;

    switch (action) {
      case "create":
        if (!this.isOfflineTimeEntry(data)) {
          throw new Error("Invalid data for create operation");
        }
        return await this.createTimeEntryOnServer(data);
      case "update":
        return await this.updateTimeEntryOnServer(
          recordId,
          data as Partial<OfflineTimeEntry>,
        );
      case "delete":
        return await this.deleteTimeEntryOnServer(recordId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private isOfflineTimeEntry(data: unknown): data is OfflineTimeEntry {
    if (typeof data !== "object" || data === null) {
      return false;
    }

    const entry = data as Record<string, unknown>;

    return (
      typeof entry.userId === "string" &&
      entry.date instanceof Date &&
      entry.timeStarted instanceof Date &&
      entry.timeEnded instanceof Date &&
      typeof entry.hoursWorked === "number" &&
      Array.isArray(entry.studies) &&
      typeof entry.participated === "boolean"
    );
  }

  private async createTimeEntryOnServer(data: OfflineTimeEntry) {
    const response = await fetch("/api/sync/time-entry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: data.date,
        timeStarted: data.timeStarted,
        timeEnded: data.timeEnded,
        studies: data.studies,
        participated: data.participated,
        comments: data.comments,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create time entry");
    }

    return response.json();
  }

  private async updateTimeEntryOnServer(
    recordId: string,
    data: Partial<OfflineTimeEntry>,
  ) {
    const response = await fetch(`/api/sync/time-entry/${recordId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: data.date,
        timeStarted: data.timeStarted,
        timeEnded: data.timeEnded,
        studies: data.studies,
        participated: data.participated,
        comments: data.comments,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update time entry");
    }

    return response.json();
  }

  private async deleteTimeEntryOnServer(recordId: string) {
    const response = await fetch(`/api/sync/time-entry/${recordId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete time entry");
    }

    return response.json();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async forcSync(): Promise<boolean> {
    console.log("Force sync requested");
    return await this.syncPendingData();
  }

  async clearPendingData(): Promise<void> {
    await offlineDb.clearSyncQueue();
    console.log("Pending sync data cleared");
  }

  getSyncStatus() {
    return {
      syncInProgress: this.syncInProgress,
      isOnline: navigator.onLine,
    };
  }

  async downloadServerData(userId: string): Promise<void> {
    if (!navigator.onLine) {
      throw new Error("Cannot download data while offline");
    }

    try {
      // Get the current year and month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Download recent data (last 3 months)
      for (let i = 0; i < 3; i++) {
        const targetDate = new Date(year, month - 1 - i, 1);
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth() + 1;

        const response = await fetch(
          `/api/entries/monthly?year=${targetYear}&month=${targetMonth}`,
        );

        if (response.ok) {
          const data = await response.json();

          // Store entries in offline database
          for (const entry of (data.entries as ServerTimeEntry[]) || []) {
            const offlineEntry: OfflineTimeEntry = {
              userId,
              date: new Date(entry.date),
              timeStarted: new Date(entry.timeStarted),
              timeEnded: new Date(entry.timeEnded),
              hoursWorked: entry.hoursWorked,
              studies: entry.studies.map((s: ServerStudy) => s.participant),
              participated: entry.participated,
              comments: entry.comments ?? undefined,
              synced: true, // Already synced from server
              createdAt: new Date(entry.createdAt),
              updatedAt: new Date(entry.updatedAt),
            };

            // Check if entry already exists
            const existing = await offlineDb.timeEntries
              .where("userId")
              .equals(userId)
              .and(
                (e) =>
                  e.date.getTime() === offlineEntry.date.getTime() &&
                  e.timeStarted.getTime() ===
                    offlineEntry.timeStarted.getTime(),
              )
              .first();

            if (!existing) {
              await offlineDb.timeEntries.add(offlineEntry);
            }
          }
        }
      }

      await offlineDb.updateLastSyncTime(userId);
      console.log("Server data downloaded successfully");
    } catch (error) {
      console.error("Failed to download server data:", error);
      throw error;
    }
  }

  async getConflicts(userId: string) {
    // Simple conflict detection - entries modified both locally and on server
    // In a real app, you'd want more sophisticated conflict resolution
    const unsyncedEntries = await offlineDb.getUnsyncedEntries(userId);
    return unsyncedEntries.filter((entry) => entry.updatedAt > entry.createdAt);
  }

  async resolveConflict(entryId: number, resolution: "local" | "server") {
    if (resolution === "local") {
      // Keep local version and sync to server
      const entry = await offlineDb.timeEntries.get(entryId);
      if (entry) {
        // Mark as needing sync by updating the entry
        await offlineDb.updateTimeEntry(entryId, entry);
      }
    } else {
      // Discard local version and download from server
      await offlineDb.timeEntries.delete(entryId);
      // Note: In a real implementation, you'd fetch the server version
    }
  }
}

// Create singleton instance
export const syncService = new SyncService();

// Hook for React components
export const useSyncService = () => {
  const triggerSync = (): Promise<boolean> => syncService.forcSync();
  const clearPending = (): Promise<void> => syncService.clearPendingData();
  const getStatus = (): SyncStatus => syncService.getSyncStatus();

  return {
    triggerSync,
    clearPending,
    getStatus,
    syncService,
  };
};
