const STORAGE_KEY = "compis.session";

export interface Session {
  token: string;
  roomieId: number;
}

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (typeof parsed.token === "string" && typeof parsed.roomieId === "number") {
      return { token: parsed.token, roomieId: parsed.roomieId };
    }
  } catch {
    return null;
  }
  return null;
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    return;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function onUnauthorized(listener: Listener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export function notifyUnauthorized(): void {
  unauthorizedListeners.forEach((listener) => listener());
}
