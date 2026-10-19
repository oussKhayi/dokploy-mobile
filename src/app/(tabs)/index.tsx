import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, TextInput, View } from "react-native";
import { Card, Empty, ErrorView, Icon, Loading, Row, StatusDot } from "../../components/ui";
import { useProjects } from "../../lib/queries";
import { servicesOf } from "../../lib/services";
import { colors, radius, space } from "../../theme";

export default function Projects() {
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useProjects();
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
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.muted} />}
      ListHeaderComponent={
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
