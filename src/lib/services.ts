import type { Environment, ServiceSummary, ServiceType, Status } from "./types";

export type ActionKey = "deploy" | "redeploy" | "start" | "stop" | "reload";

type ServiceConfig = {
  label: string;
  icon: string; // Ionicons name
  idKey: string;
  actions: ActionKey[];
  hasDomains: boolean;
  hasDeployments: boolean;
  isDatabase: boolean;
};

const db = (label: string, icon = "server-outline"): Omit<ServiceConfig, "idKey"> => ({
  label,
  icon,
  actions: ["deploy", "start", "stop", "reload"],
  hasDomains: false,
  hasDeployments: false,
  isDatabase: true,
});

export const SERVICE_CONFIG: Record<ServiceType, ServiceConfig> = {
  application: {
    label: "Application",
    icon: "cube-outline",
    idKey: "applicationId",
    actions: ["deploy", "redeploy", "start", "stop", "reload"],
    hasDomains: true,
    hasDeployments: true,
    isDatabase: false,
  },
  compose: {
    label: "Compose",
    icon: "layers-outline",
    idKey: "composeId",
    actions: ["deploy", "redeploy", "start", "stop"],
    hasDomains: true,
    hasDeployments: true,
    isDatabase: false,
  },
  postgres: { ...db("PostgreSQL"), idKey: "postgresId" },
  mysql: { ...db("MySQL"), idKey: "mysqlId" },
  mariadb: { ...db("MariaDB"), idKey: "mariadbId" },
  mongo: { ...db("MongoDB", "leaf-outline"), idKey: "mongoId" },
  redis: { ...db("Redis", "flash-outline"), idKey: "redisId" },
  libsql: { ...db("libSQL"), idKey: "libsqlId" },
};

export const ACTION_META: Record<ActionKey, { label: string; icon: string; confirm?: string }> = {
  deploy: { label: "Deploy", icon: "rocket-outline" },
  redeploy: { label: "Rebuild", icon: "refresh-outline", confirm: "Rebuild and redeploy this service?" },
  start: { label: "Start", icon: "play-outline" },
  stop: { label: "Stop", icon: "stop-outline", confirm: "Stop this service? It will go offline." },
  reload: { label: "Reload", icon: "reload-outline" },
};

export function isServiceType(v: string): v is ServiceType {
  return v in SERVICE_CONFIG;
}

const ENV_KEYS: [keyof Environment, ServiceType][] = [
  ["applications", "application"],
  ["compose", "compose"],
  ["postgres", "postgres"],
  ["mysql", "mysql"],
  ["mariadb", "mariadb"],
  ["mongo", "mongo"],
  ["redis", "redis"],
  ["libsql", "libsql"],
];

export function servicesOf(env: Environment): ServiceSummary[] {
  const out: ServiceSummary[] = [];
  for (const [key, type] of ENV_KEYS) {
    const list = (env[key] as Record<string, unknown>[] | undefined) ?? [];
    const idKey = SERVICE_CONFIG[type].idKey;
    for (const s of list) {
      out.push({
        type,
        id: String(s[idKey]),
        name: String(s.name),
        status: ((type === "compose" ? s.composeStatus : s.applicationStatus) ?? "idle") as Status,
      });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
