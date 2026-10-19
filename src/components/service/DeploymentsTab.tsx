import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, RefreshControl } from "react-native";
import { useApi } from "../../lib/auth";
import { duration, timeAgo } from "../../lib/format";
import { keys } from "../../lib/queries";
import type { Deployment, ServiceType } from "../../lib/types";
import { colors, space } from "../../theme";
import { Card, Empty, ErrorView, Loading, Row, StatusBadge } from "../ui";

export function DeploymentsTab({ type, id }: { type: ServiceType; id: string }) {
  const api = useApi();
  const router = useRouter();
  const q = useQuery({
    queryKey: [...keys.deployments(type, id)],
    queryFn: () =>
      type === "compose"
        ? api.query<Deployment[]>("deployment.allByCompose", { composeId: id })
        : api.query<Deployment[]>("deployment.all", { applicationId: id }),
    refetchInterval: (query) => (query.state.data?.some((d) => d.status === "running") ? 4000 : false),
  });

  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorView error={q.error} onRetry={q.refetch} />;

  const list = [...(q.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <FlatList
      data={list}
      keyExtractor={(d) => d.deploymentId}
      contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.muted} />}
      ListEmptyComponent={<Empty icon="rocket-outline" text="No deployments yet" />}
      renderItem={({ item, index }) => (
        <Card
          style={{
            borderRadius: 0,
            borderTopLeftRadius: index === 0 ? 14 : 0,
            borderTopRightRadius: index === 0 ? 14 : 0,
            borderBottomLeftRadius: index === list.length - 1 ? 14 : 0,
            borderBottomRightRadius: index === list.length - 1 ? 14 : 0,
          }}
        >
          <Row
            title={item.title || "Deployment"}
            subtitle={[timeAgo(item.createdAt), duration(item.startedAt, item.finishedAt)].filter(Boolean).join(" · ")}
            right={<StatusBadge status={item.status} deployment />}
            onPress={() =>
              router.push({
                pathname: "/deployment/[deploymentId]",
                params: { deploymentId: item.deploymentId, status: item.status },
              })
            }
          />
        </Card>
      )}
    />
  );
}
