import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Alert, FlatList, RefreshControl, TextInput, View } from "react-native";
import { Card, Empty, ErrorView, Icon, Loading, Row, Segmented, StatusDot } from "../components/ui";
import { useApi } from "../lib/auth";
import { useAction } from "../lib/hooks";
import { colors, radius, space } from "../theme";

type DockerContainer = {
  containerId: string;
  name: string;
  image: string;
  ports: string;
  state: string;
  status: string;
};

export default function Containers() {
  const api = useApi();
  const [filter, setFilter] = useState<"all" | "running" | "stopped">("all");
  const [q, setQ] = useState("");
  const key = ["containers-all"];
  const list = useQuery({ queryKey: key, queryFn: () => api.query<DockerContainer[]>("docker.getContainers") });
  const action = useAction({ invalidate: [key] });

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (list.data ?? [])
      .filter((c) => (filter === "all" ? true : filter === "running" ? c.state === "running" : c.state !== "running"))
      .filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.image.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [list.data, filter, q]);

  if (list.isLoading) return <Loading />;
  if (list.error) return <ErrorView error={list.error} onRetry={list.refetch} />;

  const open = (c: DockerContainer) => {
    const run = (procedure: string, label: string, confirm?: string) =>
      action.mutate({ procedure, input: { containerId: c.containerId }, confirm, destructive: !!confirm, success: `${label}: ${c.name}` });
    const running = c.state === "running";
    Alert.alert(c.name, `${c.image}\n${c.status}`, [
      { text: "Restart", onPress: () => run("docker.restartContainer", "Restarting") },
      running
        ? { text: "Stop", style: "destructive", onPress: () => run("docker.stopContainer", "Stopping", `Stop ${c.name}?`) }
        : { text: "Start", onPress: () => run("docker.startContainer", "Starting") },
      { text: "Close", style: "cancel" },
    ]);
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(c) => c.containerId}
      contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }}
      refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} tintColor={colors.muted} />}
      ListHeaderComponent={
        <View style={{ gap: space(3), marginBottom: space(3) }}>
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
            }}
          >
            <Icon name="search" size={16} color={colors.faint} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search name or image"
              placeholderTextColor={colors.faint}
              autoCapitalize="none"
              style={{ flex: 1, color: colors.text, paddingVertical: space(2.5), fontSize: 15 }}
            />
          </View>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: `All (${list.data?.length ?? 0})` },
              { value: "running", label: "Running" },
              { value: "stopped", label: "Stopped" },
            ]}
          />
        </View>
      }
      ListEmptyComponent={<Empty icon="cube-outline" text="No containers" />}
      renderItem={({ item }) => (
        <Card style={{ marginBottom: space(2) }}>
          <Row
            title={item.name}
            subtitle={`${item.image}\n${item.status}`}
            left={<StatusDot status={item.state === "running" ? "done" : item.state === "exited" ? "error" : "idle"} />}
            onPress={() => open(item)}
          />
        </Card>
      )}
    />
  );
}
