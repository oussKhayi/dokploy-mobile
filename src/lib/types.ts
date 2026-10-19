export type Status = "idle" | "running" | "done" | "error";

export type ServiceType =
  | "application"
  | "compose"
  | "postgres"
  | "mysql"
  | "mariadb"
  | "mongo"
  | "redis"
  | "libsql";

export type ServiceSummary = {
  type: ServiceType;
  id: string;
  name: string;
  status: Status;
};

export type Environment = {
  environmentId: string;
  name: string;
  isDefault?: boolean;
  applications?: { applicationId: string; name: string; applicationStatus: Status }[];
  compose?: { composeId: string; name: string; composeStatus: Status }[];
  postgres?: { postgresId: string; name: string; applicationStatus: Status }[];
  mysql?: { mysqlId: string; name: string; applicationStatus: Status }[];
  mariadb?: { mariadbId: string; name: string; applicationStatus: Status }[];
  mongo?: { mongoId: string; name: string; applicationStatus: Status }[];
  redis?: { redisId: string; name: string; applicationStatus: Status }[];
  libsql?: { libsqlId: string; name: string; applicationStatus: Status }[];
};

export type Project = {
  projectId: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  environments?: Environment[];
};

// Fields shared by application/compose/database "one" responses (subset we use)
export type ServiceDetail = {
  name: string;
  appName: string;
  description?: string | null;
  env?: string | null;
  buildArgs?: string | null;
  buildSecrets?: string | null;
  createEnvFile?: boolean;
  applicationStatus?: Status;
  composeStatus?: Status;
  composeType?: "docker-compose" | "stack";
  serverId?: string | null;
  sourceType?: string;
  buildType?: string;
  repository?: string | null;
  branch?: string | null;
  owner?: string | null;
  dockerImage?: string | null;
  customGitUrl?: string | null;
  customGitBranch?: string | null;
  autoDeploy?: boolean | null;
  createdAt?: string;
  databaseName?: string;
  databaseUser?: string;
  externalPort?: number | null;
  environment?: { name: string; project?: { name: string; projectId: string } };
};

export type Domain = {
  domainId: string;
  host: string;
  path?: string | null;
  port?: number | null;
  https: boolean;
  certificateType: "letsencrypt" | "none" | "custom";
  serviceName?: string | null;
};

export type Deployment = {
  deploymentId: string;
  title: string;
  description?: string | null;
  status: "running" | "done" | "error" | "cancelled" | "idle";
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
};

export type Container = { containerId: string; name: string; state: string; status: string };

export type Member = {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member" | string;
  createdAt: string;
  canCreateProjects?: boolean;
  canCreateServices?: boolean;
  canDeleteProjects?: boolean;
  canDeleteServices?: boolean;
  canDeleteEnvironments?: boolean;
  canAccessToDocker?: boolean;
  canAccessToTraefikFiles?: boolean;
  canAccessToAPI?: boolean;
  canAccessToSSHKeys?: boolean;
  canAccessToGitProviders?: boolean;
  accessedProjects?: string[];
  accessedEnvironments?: string[];
  accessedServices?: string[];
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    image?: string | null;
  };
};
