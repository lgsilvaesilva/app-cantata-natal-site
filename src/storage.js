// localStorage wrapper that never throws. If localStorage is blocked
// (private mode, disabled site data), values live in memory for this session
// and `persistent` is false so the UI can warn that progress may be lost.
// Only small JSON (progress, preferences, timestamps) goes through here —
// never voice recordings.

export function safeLocalStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createStorage(backend = safeLocalStorage()) {
  const memory = new Map();
  let persistent = false;
  if (backend) {
    try {
      const probe = '__csj_probe__';
      backend.setItem(probe, '1');
      backend.removeItem(probe);
      persistent = true;
    } catch {
      persistent = false;
    }
  }

  return {
    get persistent() {
      return persistent;
    },
    get(key) {
      if (persistent) {
        try {
          return backend.getItem(key);
        } catch {
          /* fall through to memory */
        }
      }
      return memory.has(key) ? memory.get(key) : null;
    },
    /** Returns true only when the value was really written to localStorage. */
    set(key, value) {
      memory.set(key, value);
      if (!persistent) return false;
      try {
        backend.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      memory.delete(key);
      if (!persistent) return;
      try {
        backend.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

export function readJSON(storage, key) {
  const raw = storage.get(key);
  if (raw == null) return { value: null, corrupt: false };
  try {
    return { value: JSON.parse(raw), corrupt: false };
  } catch {
    return { value: null, corrupt: true };
  }
}
