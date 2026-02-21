// src/core/persistence/index.ts

/**
 * ============================================================
 * ZENVIX PERSISTENCE LAYER
 * * Public API for all persistence operations
 * ============================================================
 */

import { v4 as uuidv4 } from 'uuid';

// Export the prisma client so the rest of the app can use it
export { prisma } from "./database/client";

/**
 * Generates a unique ID with an optional prefix.
 */
export const nextId = (prefix?: string) => {
  const id = uuidv4().replace(/-/g, '').slice(0, 12);
  return prefix ? `${prefix}_${id}` : id;
};

/**
 * Mock storage helpers used by some legacy repositories
 */
export const saveToStorage = (key: string, data: any) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(data));
  }
};

export const loadFromStorage = <T>(key: string, defaultValue: T | null = null): T | null => {
  if (typeof window === "undefined") return defaultValue;
  const data = window.localStorage.getItem(key);
  return data ? JSON.parse(data) as T : defaultValue;
};

export const ensureSeed = <T>(key: string, initialData: T[]): T[] => {
  if (typeof window === "undefined") return initialData;
  const existing = window.localStorage.getItem(key);
  if (existing) return JSON.parse(existing) as T[];
  window.localStorage.setItem(key, JSON.stringify(initialData));
  return initialData;
};
