import type { AuthUser } from "@/lib/types";

const TOKEN_KEY = "gymflow_token";
const USER_KEY = "gymflow_user";
const AUTH_STORAGE_EVENT = "gymflow_auth_storage_changed";

function notifyAuthStorageChanged() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
}

export const authStorage = {
  subscribe(callback: () => void) {
    if (typeof window === "undefined") {
      return () => {};
    }

    window.addEventListener(AUTH_STORAGE_EVENT, callback);
    window.addEventListener("storage", callback);

    const timer = window.setTimeout(() => {
      callback();
    }, 0);

    return () => {
      window.removeEventListener(AUTH_STORAGE_EVENT, callback);
      window.removeEventListener("storage", callback);
      window.clearTimeout(timer);
    };
  },

  getToken() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    window.localStorage.setItem(TOKEN_KEY, token);
    notifyAuthStorageChanged();
  },

  removeToken() {
    window.localStorage.removeItem(TOKEN_KEY);
    notifyAuthStorageChanged();
  },

  getUserRaw() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(USER_KEY);
  },

  getUser(): AuthUser | null {
    const rawUser = this.getUserRaw();

    if (!rawUser) return null;

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      return null;
    }
  },

  setUser(user: AuthUser) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    notifyAuthStorageChanged();
  },

  removeUser() {
    window.localStorage.removeItem(USER_KEY);
    notifyAuthStorageChanged();
  },

  clear() {
    if (typeof window === "undefined") return;

    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    notifyAuthStorageChanged();
  },
};
