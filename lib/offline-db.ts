// lib/offline-db.ts
import Dexie, { Table } from "dexie";
import type { OfflineTimeEntry, OfflineUser, SyncQueueItem } from "./types";

// Re-export for backward compatibility
export type { OfflineTimeEntry, OfflineUser };
export type SyncQueue = SyncQueueItem;

export class OfflineDatabase extends Dexie {
  timeEntries!: Table<OfflineTimeEntry>;
  users!: Table<OfflineUser>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super("FieldServiceReportDB");

    this.version(1).stores({
      timeEntries: "++id, userId, date, synced, createdAt",
      users: "++id, email, lastSync",
      syncQueue: "++id, action, table, recordId, timestamp, retryCount",
    });
  }

  async addTimeEntry(
    entry: Omit<OfflineTimeEntry, "id" | "synced" | "createdAt" | "updatedAt">,
  ) {
    const now = new Date();
    const offlineEntry: OfflineTimeEntry = {
      ...entry,
      synced: false,
      createdAt: now,
      updatedAt: now,
    };

    const id = await this.timeEntries.add(offlineEntry);

    // Add to sync queue
    await this.addToSyncQueue(
      "create",
      "timeEntry",
      id.toString(),
      offlineEntry,
    );

    return id;
  }

  async updateTimeEntry(id: number, updates: Partial<OfflineTimeEntry>) {
    const updatedEntry = {
      ...updates,
      synced: false,
      updatedAt: new Date(),
    };

    await this.timeEntries.update(id, updatedEntry);

    // Add to sync queue
    await this.addToSyncQueue(
      "update",
      "timeEntry",
      id.toString(),
      updatedEntry,
    );
  }

  async deleteTimeEntry(id: number) {
    await this.timeEntries.delete(id);

    // Add to sync queue
    await this.addToSyncQueue("delete", "timeEntry", id.toString(), { id });
  }

  async getTimeEntriesByMonth(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return await this.timeEntries
      .where("userId")
      .equals(userId)
      .and((entry) => entry.date >= startDate && entry.date <= endDate)
      .toArray();
  }

  async getTimeEntriesByYear(userId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    return await this.timeEntries
      .where("userId")
      .equals(userId)
      .and((entry) => entry.date >= startDate && entry.date <= endDate)
      .toArray();
  }

  async searchEntriesByParticipant(
    userId: string,
    year: number,
    participantName: string,
  ) {
    if (!participantName.trim()) return [];

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const entries = await this.timeEntries
      .where("userId")
      .equals(userId)
      .and((entry) => entry.date >= startDate && entry.date <= endDate)
      .toArray();

    return entries.filter((entry) =>
      entry.studies.some((study) =>
        study.toLowerCase().includes(participantName.toLowerCase()),
      ),
    );
  }

  private async addToSyncQueue(
    action: "create" | "update" | "delete",
    table: "timeEntry" | "user",
    recordId: string,
    data: OfflineTimeEntry | Partial<OfflineTimeEntry> | { id: number },
  ) {
    await this.syncQueue.add({
      action,
      table,
      recordId,
      data,
      timestamp: new Date(),
      retryCount: 0,
    });
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return await this.syncQueue.orderBy("timestamp").toArray();
  }

  async markSyncItemCompleted(id: number) {
    await this.syncQueue.delete(id);
  }

  async incrementSyncRetry(id: number) {
    const item = await this.syncQueue.get(id);
    if (item) {
      await this.syncQueue.update(id, { retryCount: item.retryCount + 1 });
    }
  }

  async clearSyncQueue() {
    await this.syncQueue.clear();
  }

  async markEntrySynced(id: number) {
    await this.timeEntries.update(id, { synced: true });
  }

  async getUnsyncedEntries(userId: string) {
    return await this.timeEntries
      .where("userId")
      .equals(userId)
      .and((entry) => !entry.synced)
      .toArray();
  }

  async saveUser(user: Omit<OfflineUser, "id" | "lastSync">) {
    const existingUser = await this.users
      .where("email")
      .equals(user.email)
      .first();

    if (existingUser) {
      await this.users.update(existingUser.id!, {
        ...user,
        lastSync: new Date(),
      });
      return existingUser.id!;
    } else {
      return await this.users.add({ ...user, lastSync: new Date() });
    }
  }

  async getUser(email: string) {
    return await this.users.where("email").equals(email).first();
  }

  async calculateMonthlyStats(userId: string, year: number, month: number) {
    const entries = await this.getTimeEntriesByMonth(userId, year, month);

    const totalHours = entries.reduce(
      (sum, entry) => sum + entry.hoursWorked,
      0,
    );

    // Count unique studies case-insensitively
    const uniqueStudies = new Set(
      entries.flatMap((entry) => entry.studies.map((s) => s.toLowerCase())),
    );

    const participated = entries.some((entry) => entry.participated);

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      studiesCount: uniqueStudies.size,
      participated,
      entries,
    };
  }

  async calculateYearlyStats(userId: string, year: number) {
    const entries = await this.getTimeEntriesByYear(userId, year);

    const totalHours = entries.reduce(
      (sum, entry) => sum + entry.hoursWorked,
      0,
    );

    // Count unique studies case-insensitively
    const uniqueStudies = new Set(
      entries.flatMap((entry) => entry.studies.map((s) => s.toLowerCase())),
    );

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      studiesCount: uniqueStudies.size,
      entriesCount: entries.length,
    };
  }

  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  async getLastSyncTime(userId: string): Promise<Date | null> {
    const user = await this.users.where("email").equals(userId).first();
    return user?.lastSync || null;
  }

  async updateLastSyncTime(userId: string) {
    const user = await this.users.where("email").equals(userId).first();
    if (user) {
      await this.users.update(user.id!, { lastSync: new Date() });
    }
  }
}

// Create singleton instance
export const offlineDb = new OfflineDatabase();

// Helper functions for easier usage
export const useOfflineStorage = () => {
  const isOnline = () => navigator.onLine;

  const shouldUseOffline = () => !isOnline();

  return {
    isOnline,
    shouldUseOffline,
    db: offlineDb,
  };
};
