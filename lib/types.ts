// lib/types.ts

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Study {
  id: string;
  entryId: string;
  participant: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  userId: string;
  date: Date;
  timeStarted: Date;
  timeEnded: Date;
  hoursWorked: number;
  studies: Study[];
  participated: boolean;
  comments?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyReport {
  totalHours: number;
  studiesCount: number;
  participated: boolean;
  entries: TimeEntry[];
}

export interface YearlyStats {
  totalHours: number;
  studiesCount: number;
  entriesCount: number;
}

export interface OfflineTimeEntry {
  id?: number;
  userId: string;
  date: Date;
  timeStarted: Date;
  timeEnded: Date;
  hoursWorked: number;
  studies: string[];
  participated: boolean;
  comments?: string;
  synced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfflineUser {
  id?: number;
  email: string;
  name?: string;
  lastSync: Date;
}

export interface SyncQueueItem {
  id?: number;
  action: "create" | "update" | "delete";
  table: "timeEntry" | "user";
  recordId: string;
  data: OfflineTimeEntry | Partial<OfflineTimeEntry> | { id: number };
  timestamp: Date;
  retryCount: number;
}

export interface ServerStudy {
  id: string;
  participant: string;
}

export interface ServerTimeEntry {
  id: string;
  date: string;
  timeStarted: string;
  timeEnded: string;
  hoursWorked: number;
  studies: ServerStudy[];
  participated: boolean;
  comments?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeEntryData {
  date: Date;
  timeStarted: Date;
  timeEnded: Date;
  studies: string[];
  participated: boolean;
  comments?: string;
}

export interface FormMessage {
  type: "success" | "error";
  text: string;
}

export interface SyncStatus {
  syncInProgress: boolean;
  isOnline: boolean;
}
