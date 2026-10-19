import { useQuery } from "@tanstack/react-query";
import { useApi } from "./auth";
import { SERVICE_CONFIG } from "./services";
import type { Project, ServiceDetail, ServiceType } from "./types";

export const keys = {
  projects: ["projects"] as const,
  service: (type: ServiceType, id: string) => ["service", type, id] as const,
  domains: (type: ServiceType, id: string) => ["domains", type, id] as const,
  deployments: (type: ServiceType, id: string) => ["deployments", type, id] as const,
  members: ["members"] as const,
};

export function useProjects() {
  const api = useApi();
  return useQuery({ queryKey: keys.projects, queryFn: () => api.query<Project[]>("project.all") });
}

export function useService(type: ServiceType, id: string) {
  const api = useApi();
  return useQuery({
    queryKey: keys.service(type, id),
    queryFn: () => api.query<ServiceDetail>(`${type}.one`, { [SERVICE_CONFIG[type].idKey]: id }),
    // keep status fresh while a deployment is in progress
    refetchInterval: (q) => {
      const d = q.state.data;
      const st = d?.applicationStatus ?? d?.composeStatus;
      return st === "running" ? 4000 : false;
    },
  });
}
