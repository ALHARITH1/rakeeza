/**
 * Storage layer.
 * The app talks only to the `StorageAdapter` interface, so swapping localStorage
 * for a real backend (REST / Supabase / Firebase) means writing one new adapter
 * and changing `storage` below — no component changes.
 */
export interface StorageAdapter {
  load<T>(key: string): T | null;
  save<T>(key: string, value: T): void;
  remove(key: string): void;
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private prefix = 'infraops:') {}
  load<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
  save<T>(key: string, value: T) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (e) {
      console.warn('[storage] save failed', e);
    }
  }
  remove(key: string) {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      /* ignore */
    }
  }
}

/** In-memory fallback (private mode / blocked storage) */
export class MemoryAdapter implements StorageAdapter {
  private m = new Map<string, string>();
  load<T>(key: string) {
    const v = this.m.get(key);
    return v ? (JSON.parse(v) as T) : null;
  }
  save<T>(key: string, value: T) {
    this.m.set(key, JSON.stringify(value));
  }
  remove(key: string) {
    this.m.delete(key);
  }
}

function pickAdapter(): StorageAdapter {
  try {
    const k = '__infraops_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return new LocalStorageAdapter();
  } catch {
    return new MemoryAdapter();
  }
}

export const storage: StorageAdapter = pickAdapter();

export const DB_KEY = 'db:v2';
export const SESSION_KEY = 'session';

/** Simple deterministic hash for demo passwords (replace with server-side auth in production) */
export function hashPassword(pw: string): string {
  let h1 = 0xdeadbeef ^ pw.length;
  let h2 = 0x41c6ce57 ^ pw.length;
  for (let i = 0; i < pw.length; i++) {
    const ch = pw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
