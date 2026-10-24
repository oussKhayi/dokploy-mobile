import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { Card, Empty, ErrorView, Icon, Loading, Row, StatusDot } from "../../components/ui";
import { useApi } from "../../lib/auth";
import { useProjects } from "../../lib/queries";
import { servicesOf } from "../../lib/services";
import { colors, radius, space } from "../../theme";

export default function Projects() {
  const router = useRouter();
  const api = useApi();
  const { data, isLoading, error, refetch, isRefetching } = useProjects();
  const stats = useQuery({ queryKey: ["homeStats"], queryFn: () => api.query<HomeStats>("project.homeStats") });
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const list = (data ?? []).map((p) => {
      const services = (p.environments ?? []).flatMap(servicesOf);
      return {
        project: p,
        total: services.length,
        errors: services.filter((s) => s.status === "error").length,
        deploying: services.filter((s) => s.status === "running").length,
      };
    });
    const needle = q.trim().toLowerCase();
    return needle ? list.filter((i) => i.project.name.toLowerCase().includes(needle)) : list;
  }, [data, q]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={refetch} />;

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.project.projectId}
      contentContainerStyle={{ padding: space(4), gap: space(3) }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
            void stats.refetch();
          }}
          tintColor={colors.muted}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: space(3) }}>
        <Stack.Screen
          options={{
            headerLeft: () => (
              <Pressable hitSlop={10} onPress={() => router.push("/project/new")} style={{ marginLeft: space(4) }}>
                <Icon name="add-circle-outline" size={24} />
              </Pressable>
            ),
          }}
        />
        {stats.data ? <StatsBar s={stats.data} /> : null}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space(2),
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: space(3),
            marginBottom: space(1),
          }}
        >
          <Icon name="search" size={16} color={colors.faint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search projects"
            placeholderTextColor={colors.faint}
            style={{ flex: 1, color: colors.text, paddingVertical: space(2.5), fontSize: 15 }}
          />
        </View>
        </View>
      }
      ListEmptyComponent={<Empty icon="folder-open-outline" text="No projects" />}
      renderItem={({ item }) => (
        <Card>
          <Row
            title={item.project.name}
            subtitle={item.project.description || `${item.total} service${item.total === 1 ? "" : "s"}`}
            left={<Icon name="folder-outline" color={colors.muted} />}
            right={
              <View style={{ flexDirection: "row", gap: space(2), alignItems: "center" }}>
                {item.deploying > 0 ? <Counter status="running" n={item.deploying} /> : null}
                {item.errors > 0 ? <Counter status="error" n={item.errors} /> : null}
              </View>
            }
            onPress={() =>
              router.push({ pathname: "/project/[projectId]", params: { projectId: item.project.projectId } })
            }
          />
        </Card>
      )}
    />
  );
}

function Counter({ status, n }: { status: string; n: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <StatusDot status={status} />
      <Text style={{ color: colors.muted, fontSize: 12 }}>{n}</Text>
    </View>
  );
}

type HomeStats = {
  projects: number;
  services: number;
  applications: number;
  compose: number;
  databases: number;
  status: { running: number; error: number; idle: number };
};

function StatsBar({ s }: { s: HomeStats }) {
  const cells: [string, number, string?][] = [
    ["Projects", s.projects],
    ["Services", s.services],
    ["Running", s.status.running, colors.success],
    ["Errors", s.status.error, s.status.error ? colors.danger : undefined],
  ];
  return (
    <Card style={{ flexDirection: "row" }}>
      {cells.map(([label, n, c], i) => (
        <View
          key={label}
          style={{
            flex: 1,
            paddingVertical: space(3),
            alignItems: "center",
            borderLeftWidth: i ? 1 : 0,
            borderLeftColor: colors.border,
          }}
        >
          <Text style={{ color: c ?? colors.text, fontSize: 20, fontWeight: "700" }}>{n}</Text>
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{label}</Text>
        </View>
      ))}
    </Card>
  );
}
