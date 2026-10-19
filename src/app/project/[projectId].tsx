import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Card, Empty, ErrorView, Icon, Loading, Row, SectionTitle, Segmented, StatusBadge } from "../../components/ui";
import { useProjects } from "../../lib/queries";
import { SERVICE_CONFIG, servicesOf } from "../../lib/services";
import type { ServiceSummary } from "../../lib/types";
import { colors, space } from "../../theme";

export default function ProjectScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useProjects();
  const project = data?.find((p) => p.projectId === projectId);
  const envs = project?.environments ?? [];
  const [envId, setEnvId] = useState<string | undefined>();

  useEffect(() => {
    if (!envId && envs.length) setEnvId((envs.find((e) => e.isDefault) ?? envs[0]).environmentId);
  }, [envs, envId]);

  const env = envs.find((e) => e.environmentId === envId);
  const groups = useMemo(() => {
    const all = env ? servicesOf(env) : [];
    return [
      { title: "Applications", items: all.filter((s) => s.type === "application") },
      { title: "Compose", items: all.filter((s) => s.type === "compose") },
      { title: "Databases", items: all.filter((s) => SERVICE_CONFIG[s.type].isDatabase) },
    ].filter((g) => g.items.length);
  }, [env]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={refetch} />;
  if (!project) return <Empty text="Project not found" />;

  const open = (s: ServiceSummary) =>
    router.push({ pathname: "/service/[type]/[id]", params: { type: s.type, id: s.id, name: s.name } });

  return (
    <ScrollView
      contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.muted} />}
    >
      <Stack.Screen options={{ title: project.name }} />
      {envs.length > 1 ? (
        <Segmented
          value={envId ?? ""}
          onChange={setEnvId}
          options={envs.map((e) => ({ value: e.environmentId, label: e.name }))}
        />
      ) : null}

      {groups.length === 0 ? <Empty icon="cube-outline" text="No services in this environment" /> : null}

      {groups.map((g) => (
        <View key={g.title}>
          <SectionTitle>{g.title}</SectionTitle>
          <Card>
            {g.items.map((s) => (
              <Row
                key={s.id}
                title={s.name}
                subtitle={SERVICE_CONFIG[s.type].label}
                left={<Icon name={SERVICE_CONFIG[s.type].icon} color={colors.muted} />}
                right={<StatusBadge status={s.status} />}
                onPress={() => open(s)}
              />
            ))}
          </Card>
        </View>
      ))}
    </ScrollView>
  );
}
