// ============================================================
// IDENTITY STORAGE - Session persistence for Identity module
// ============================================================

import type {
  UIContext,
  Organization,
  User,
  Role,
  Site,
  ModuleInstance,
  License,
} from "../types";

const STORAGE_KEYS = {
  SESSION: "opscore_session",
  THEME: "opscore_theme",
} as const;

// ============================================================
// STORED SESSION - Full UI Context with expiration
// ============================================================

export interface StoredSession extends UIContext {
  expiresAt: string;
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

/**
 * Save full session (UIContext + expiration)
 */
export function saveSession(data: Omit<StoredSession, "expiresAt">): void {
  try {
    const session: StoredSession = {
      ...data,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to save session:", error);
  }
}

/**
 * Get session if it exists and is not expired
 */
export function getSession(): StoredSession | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!stored) return null;

    const session: StoredSession = JSON.parse(stored);

    if (new Date(session.expiresAt) < new Date()) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}

/**
 * Clear session completely
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch (error) {
    console.error("Failed to clear session:", error);
  }
}

// ============================================================
// SESSION UPDATES
// ============================================================

export function updateSite(site: Site): void {
  try {
    const session = getSession();
    if (session) {
      session.site = site;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  } catch (error) {
    console.error("Failed to update site:", error);
  }
}

export function updateUser(user: User): void {
  try {
    const session = getSession();
    if (session) {
      session.user = user;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  } catch (error) {
    console.error("Failed to update user:", error);
  }
}

export function updateActiveModules(activeModules: ModuleInstance[]): void {
  try {
    const session = getSession();
    if (session) {
      session.activeModules = activeModules;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  } catch (error) {
    console.error("Failed to update active modules:", error);
  }
}

export function updateLicenses(licenses: License[]): void {
  try {
    const session = getSession();
    if (session) {
      session.licenses = licenses;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  } catch (error) {
    console.error("Failed to update licenses:", error);
  }
}

// ============================================================
// THEME MANAGEMENT
// ============================================================

export function getTheme(): "light" | "dark" {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    return theme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function setTheme(theme: "light" | "dark"): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error("Failed to save theme:", error);
  }
}
