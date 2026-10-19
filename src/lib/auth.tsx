import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createApi, normalizeUrl, type Api, type Credentials } from "./api";

const KEY = "dokploy.credentials.v1";

type AuthState = {
  ready: boolean;
  creds: Credentials | null;
  api: Api | null;
  connect: (url: string, apiKey: string) => Promise<void>;
  disconnect: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [creds, setCreds] = useState<Credentials | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((raw) => raw && setCreds(JSON.parse(raw) as Credentials))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const connect = useCallback(async (rawUrl: string, apiKey: string) => {
    const next = { url: normalizeUrl(rawUrl), apiKey: apiKey.trim() };
    // Validate before saving: any authenticated read works
    await createApi(next).query("project.all");
    await SecureStore.setItemAsync(KEY, JSON.stringify(next));
    setCreds(next);
  }, []);

  const disconnect = useCallback(async () => {
    await SecureStore.deleteItemAsync(KEY);
    setCreds(null);
  }, []);

  const api = useMemo(() => (creds ? createApi(creds) : null), [creds]);

  return (
    <AuthContext.Provider value={{ ready, creds, api, connect, disconnect }}>
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
