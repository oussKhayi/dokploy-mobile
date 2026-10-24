import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createApi, normalizeUrl, type Api, type Credentials } from "./api";

/**
 * Multi-account storage.
 *  - INDEX_KEY holds the account list WITHOUT secrets + the active id.
 *  - Each API key lives in its own SecureStore entry (keeps entries small
 *    and lets us delete one account without rewriting the others).
 */
const INDEX_KEY = "dokploy.accounts.v2";
const SECRET_PREFIX = "dokploy.account.key.";
const LEGACY_KEY = "dokploy.credentials.v1";

export type Account = {
  id: string;
  name: string; // user-facing label, defaults to the host
  url: string;
  email?: string;
  role?: string;
};

type Index = { accounts: Account[]; activeId: string | null };

type AuthState = {
  ready: boolean;
  accounts: Account[];
  active: Account | null;
  creds: Credentials | null;
  api: Api | null;
  addAccount: (url: string, apiKey: string, name?: string) => Promise<Account>;
  switchAccount: (id: string) => Promise<void>;
  renameAccount: (id: string, name: string) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const secretKey = (id: string) => SECRET_PREFIX + id;
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
export const hostOf = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

async function saveIndex(index: Index) {
  await SecureStore.setItemAsync(INDEX_KEY, JSON.stringify(index));
}

async function loadIndex(): Promise<Index> {
  const raw = await SecureStore.getItemAsync(INDEX_KEY);
  if (raw) return JSON.parse(raw) as Index;

  // Migrate the single-account format from v0.1
  const legacy = await SecureStore.getItemAsync(LEGACY_KEY);
  if (legacy) {
    const c = JSON.parse(legacy) as Credentials;
    const acc: Account = { id: newId(), name: hostOf(c.url), url: c.url };
    await SecureStore.setItemAsync(secretKey(acc.id), c.apiKey);
    const index = { accounts: [acc], activeId: acc.id };
    await saveIndex(index);
    await SecureStore.deleteItemAsync(LEGACY_KEY);
    return index;
  }
  return { accounts: [], activeId: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState<Index>({ accounts: [], activeId: null });
  const [creds, setCreds] = useState<Credentials | null>(null);

  const activate = useCallback(async (acc: Account | null) => {
    if (!acc) return setCreds(null);
    const apiKey = await SecureStore.getItemAsync(secretKey(acc.id));
    setCreds(apiKey ? { url: acc.url, apiKey } : null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const idx = await loadIndex();
        setIndex(idx);
        await activate(idx.accounts.find((a) => a.id === idx.activeId) ?? null);
      } catch {
        // corrupted storage: start clean
      } finally {
        setReady(true);
      }
    })();
  }, [activate]);

  const commit = useCallback(
    async (next: Index) => {
      await saveIndex(next);
      setIndex(next);
    },
    [],
  );

  const switchAccount = useCallback(
    async (id: string) => {
      const acc = index.accounts.find((a) => a.id === id);
      if (!acc || id === index.activeId) return;
      queryClient.clear(); // never show one server's data under another
      await activate(acc);
      await commit({ ...index, activeId: id });
    },
    [index, activate, commit, queryClient],
  );

  const addAccount = useCallback(
    async (rawUrl: string, rawKey: string, name?: string) => {
      const url = normalizeUrl(rawUrl);
      const apiKey = rawKey.trim();
      const api = createApi({ url, apiKey });
      await api.query("project.all"); // validates URL + key
      const me = await api
        .query<{ role?: string; user?: { email?: string } }>("user.get")
        .catch(() => null);

      const email = me?.user?.email;
      // Same server + same user: refresh the key instead of duplicating
      const existing = index.accounts.find((a) => a.url === url && (!!email ? a.email === email : true));
      const acc: Account = existing
        ? { ...existing, email, role: me?.role, name: name?.trim() || existing.name }
        : { id: newId(), url, email, role: me?.role, name: name?.trim() || hostOf(url) };

      await SecureStore.setItemAsync(secretKey(acc.id), apiKey);
      const accounts = existing
        ? index.accounts.map((a) => (a.id === acc.id ? acc : a))
        : [...index.accounts, acc];
      queryClient.clear();
      setCreds({ url, apiKey });
      await commit({ accounts, activeId: acc.id });
      return acc;
    },
    [index, commit, queryClient],
  );

  const renameAccount = useCallback(
    async (id: string, name: string) => {
      if (!name.trim()) return;
      await commit({ ...index, accounts: index.accounts.map((a) => (a.id === id ? { ...a, name: name.trim() } : a)) });
    },
    [index, commit],
  );

  const removeAccount = useCallback(
    async (id: string) => {
      await SecureStore.deleteItemAsync(secretKey(id));
      const accounts = index.accounts.filter((a) => a.id !== id);
      let activeId = index.activeId;
      if (activeId === id) {
        activeId = accounts[0]?.id ?? null;
        queryClient.clear();
        await activate(accounts[0] ?? null);
      }
      await commit({ accounts, activeId });
    },
    [index, activate, commit, queryClient],
  );

  const active = index.accounts.find((a) => a.id === index.activeId) ?? null;
  const api = useMemo(() => (creds ? createApi(creds) : null), [creds]);

  return (
    <AuthContext.Provider
      value={{
        ready,
        accounts: index.accounts,
        active,
        creds: active ? creds : null,
        api: active ? api : null,
        addAccount,
        switchAccount,
        renameAccount,
        removeAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Api for screens behind the auth guard. */
export function useApi(): Api {
  const { api } = useAuth();
  if (!api) throw new Error("Not connected");
  return api;
}
