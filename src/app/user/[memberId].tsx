import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button, Card, Empty, ErrorView, Loading, SectionTitle, Tag, ToggleRow } from "../../components/ui";
import { useApi } from "../../lib/auth";
import { useAction } from "../../lib/hooks";
import { keys, useProjects } from "../../lib/queries";
import { servicesOf } from "../../lib/services";
import type { Member, Project } from "../../lib/types";
import { colors, space } from "../../theme";

const PERMS: { key: keyof Member; label: string }[] = [
  { key: "canCreateProjects", label: "Create projects" },
  { key: "canDeleteProjects", label: "Delete projects" },
  { key: "canCreateServices", label: "Create services" },
  { key: "canDeleteServices", label: "Delete services" },
  { key: "canDeleteEnvironments", label: "Delete environments" },
  { key: "canAccessToDocker", label: "Access Docker" },
  { key: "canAccessToTraefikFiles", label: "Access Traefik files" },
  { key: "canAccessToAPI", label: "Access API / CLI" },
  { key: "canAccessToSSHKeys", label: "Access SSH keys" },
  { key: "canAccessToGitProviders", label: "Access Git providers" },
];

type Perms = Record<string, boolean>;
type Access = { projects: string[]; environments: string[]; services: string[] };

function projectIds(p: Project) {
  const envs = p.environments ?? [];
  return {
    environments: envs.map((e) => e.environmentId),
    services: envs.flatMap(servicesOf).map((s) => s.id),
  };
}

export default function MemberScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const router = useRouter();
  const api = useApi();
  const members = useQuery({ queryKey: [...keys.members], queryFn: () => api.query<Member[]>("user.all") });
  const projects = useProjects();
  const member = members.data?.find((m) => m.id === memberId);

  const [perms, setPerms] = useState<Perms>({});
  const [access, setAccess] = useState<Access>({ projects: [], environments: [], services: [] });

  useEffect(() => {
    if (!member) return;
    setPerms(Object.fromEntries(PERMS.map((p) => [p.key, !!member[p.key]])));
    setAccess({
      projects: member.accessedProjects ?? [],
      environments: member.accessedEnvironments ?? [],
      services: member.accessedServices ?? [],
    });
  }, [member]);

  const save = useAction({ invalidate: [[...keys.members]] });
  const remove = useAction({ invalidate: [[...keys.members]] });

  if (members.isLoading) return <Loading />;
  if (members.error) return <ErrorView error={members.error} onRetry={members.refetch} />;
  if (!member) return <Empty text="User not found" />;

  const isPrivileged = member.role === "owner" || member.role === "admin";

  const toggleProject = (p: Project, on: boolean) => {
    const ids = projectIds(p);
    const without = (list: string[], drop: string[]) => list.filter((x) => !drop.includes(x));
    setAccess((a) =>
      on
        ? {
            projects: [...new Set([...a.projects, p.projectId])],
            environments: [...new Set([...a.environments, ...ids.environments])],
            services: [...new Set([...a.services, ...ids.services])],
          }
        : {
            projects: without(a.projects, [p.projectId]),
            environments: without(a.environments, ids.environments),
            services: without(a.services, ids.services),
          },
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(12) }}>
      <Stack.Screen options={{ title: member.user.email }} />
      <Card style={{ padding: space(4), gap: space(2) }}>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>{member.user.email}</Text>
        <Tag>{member.role}</Tag>
      </Card>

      {isPrivileged ? (
        <Text style={{ color: colors.muted, marginTop: space(4) }}>
          {member.role === "owner" ? "Owners" : "Admins"} have full access. Permissions apply to members only.
        </Text>
      ) : (
        <>
          <SectionTitle>Permissions</SectionTitle>
          <Card>
            {PERMS.map((p) => (
              <ToggleRow
                key={p.key}
                label={p.label}
                value={!!perms[p.key]}
                onChange={(v) => setPerms((s) => ({ ...s, [p.key]: v }))}
              />
            ))}
          </Card>

          <SectionTitle>Project access</SectionTitle>
          {projects.isLoading ? (
            <Loading />
          ) : (
            <Card>
              {(projects.data ?? []).map((p) => (
                <ToggleRow
                  key={p.projectId}
                  label={p.name}
                  description={`${(p.environments ?? []).flatMap(servicesOf).length} services`}
                  value={access.projects.includes(p.projectId)}
                  onChange={(v) => toggleProject(p, v)}
                />
              ))}
            </Card>
          )}
          <Text style={{ color: colors.faint, fontSize: 12, marginTop: space(2) }}>
            Granting a project grants all its environments and current services.
          </Text>

          <View style={{ marginTop: space(5) }}>
            <Button
              title="Save permissions"
              icon="save-outline"
              loading={save.isPending}
              onPress={() =>
                save.mutate({
                  procedure: "user.assignPermissions",
                  input: {
                    id: member.id,
                    ...perms,
                    accessedProjects: access.projects,
                    accessedEnvironments: access.environments,
                    accessedServices: access.services,
                  },
                  success: "Permissions saved",
                })
              }
            />
          </View>
        </>
      )}

      {member.role !== "owner" ? (
        <View style={{ marginTop: space(3) }}>
          <Button
            title="Remove user"
            icon="trash-outline"
            variant="danger"
            loading={remove.isPending}
            onPress={() =>
              remove.mutate(
                {
                  procedure: "user.remove",
                  input: { userId: member.userId },
                  confirm: `Remove ${member.user.email}?`,
                  destructive: true,
                  success: "User removed",
                },
                { onSuccess: (r) => !r.skipped && router.back() },
              )
            }
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
