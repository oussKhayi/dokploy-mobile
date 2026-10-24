import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { useApi } from "../../lib/auth";
import { duration, timeAgo } from "../../lib/format";
import { useAction } from "../../lib/hooks";
import { keys } from "../../lib/queries";
import { SERVICE_CONFIG } from "../../lib/services";
import type { Deployment, ServiceType } from "../../lib/types";
import { colors, space } from "../../theme";
import { Button, Card, Empty, ErrorView, Icon, Loading, Row, StatusBadge } from "../ui";

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
  const action = useAction({ invalidate: [[...keys.deployments(type, id)], [...keys.service(type, id)]] });

  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorView error={q.error} onRetry={q.refetch} />;

  const list = [...(q.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const running = list.some((d) => d.status === "running");
  const idInput = { [SERVICE_CONFIG[type].idKey]: id };

  return (
    <FlatList
      data={list}
      keyExtractor={(d) => d.deploymentId}
      contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.muted} />}
      ListHeaderComponent={
        running ? (
          <View style={{ flexDirection: "row", gap: 8, marginBottom: space(3) }}>
            <Button
              small
              variant="danger"
              icon="close-circle-outline"
              title="Cancel deployment"
              style={{ flex: 1 }}
              loading={action.isPending}
              onPress={() =>
                action.mutate({
                  procedure: `${type}.cancelDeployment`,
                  input: idInput,
                  confirm: "Cancel the running deployment?",
                  destructive: true,
                  success: "Cancel requested",
                })
              }
            />
            <Button
              small
              variant="secondary"
              icon="flash-off-outline"
              title="Kill build"
              onPress={() =>
                action.mutate({
                  procedure: `${type}.killBuild`,
                  input: idInput,
                  confirm: "Force-kill the Docker build process?",
                  destructive: true,
                  success: "Build killed",
                })
              }
            />
          </View>
        ) : undefined
      }
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
            right={
              <View style={{ flexDirection: "row", alignItems: "center", gap: space(3) }}>
                {item.rollbackId && index > 0 && item.status === "done" ? (
                  <Pressable
                    hitSlop={10}
                    onPress={() =>
                      action.mutate({
                        procedure: "rollback.rollback",
                        input: { rollbackId: item.rollbackId },
                        confirm: `Roll back to "${item.title || "this deployment"}"?`,
                        success: "Rollback started",
                      })
                    }
                  >
                    <Icon name="arrow-undo-outline" color={colors.muted} />
                  </Pressable>
                ) : null}
                <StatusBadge status={item.status} deployment />
              </View>
            }
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
