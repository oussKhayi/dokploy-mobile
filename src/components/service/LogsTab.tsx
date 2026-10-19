import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useApi } from "../../lib/auth";
import { toast } from "../../lib/hooks";
import { SERVICE_CONFIG } from "../../lib/services";
import type { Container, ServiceDetail, ServiceType } from "../../lib/types";
import { colors, space } from "../../theme";
import { cleanLogs, LogView } from "../LogView";
import { Button, Empty, ErrorView, Loading, Segmented, StatusDot } from "../ui";

type Props = { type: ServiceType; id: string; service: ServiceDetail };

const TAILS = ["100", "500", "2000"] as const;
const SINCE = [
  { value: "all", label: "All" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "24h", label: "24h" },
] as const;

export function LogsTab({ type, id, service }: Props) {
  const api = useApi();
  const isCompose = type === "compose";
  const [tail, setTail] = useState<(typeof TAILS)[number]>("100");
  const [since, setSince] = useState<string>("all");
  const [live, setLive] = useState(false);
  const [containerId, setContainerId] = useState<string | null>(null);

  // Compose: logs are per container, so list containers first
  const containers = useQuery({
    queryKey: ["containers", id],
    enabled: isCompose,
    queryFn: () =>
      api.query<Container[]>("docker.getContainersByAppNameMatch", {
        appName: service.appName,
        appType: service.composeType ?? "docker-compose",
        serverId: service.serverId ?? undefined,
      }),
  });

  useEffect(() => {
    if (isCompose && !containerId && containers.data?.length) setContainerId(containers.data[0].containerId);
  }, [isCompose, containerId, containers.data]);

  const logs = useQuery({
    queryKey: ["logs", type, id, containerId, tail, since],
    enabled: !isCompose || !!containerId,
    queryFn: () =>
      api.query<string>(`${type}.readLogs`, {
        [SERVICE_CONFIG[type].idKey]: id,
        ...(isCompose ? { containerId } : {}),
        tail: Number(tail),
        since,
      }),
    refetchInterval: live ? 3000 : false,
  });

  if (isCompose && containers.isLoading) return <Loading />;
  if (isCompose && containers.error) return <ErrorView error={containers.error} onRetry={containers.refetch} />;
  if (isCompose && !containers.data?.length) return <Empty icon="cube-outline" text="No running containers" />;

  const text = cleanLogs(logs.data);

  return (
    <View style={{ flex: 1, padding: space(3), gap: space(2.5) }}>
      {isCompose ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space(2) }} style={{ flexGrow: 0 }}>
          {containers.data!.map((c) => {
            const active = c.containerId === containerId;
            return (
              <Pressable key={c.containerId} onPress={() => setContainerId(c.containerId)}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? colors.text : colors.border,
                    backgroundColor: active ? colors.surface2 : "transparent",
                  }}
                >
                  <StatusDot status={c.state === "running" ? "done" : "error"} />
                  <Text style={{ color: colors.text, fontSize: 12 }} numberOfLines={1}>
                    {c.name}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={{ flexDirection: "row", gap: space(2) }}>
        <View style={{ flex: 1 }}>
          <Segmented value={since} onChange={setSince} options={SINCE.map((s) => ({ ...s }))} />
        </View>
        <View style={{ flex: 0.9 }}>
          <Segmented value={tail} onChange={setTail} options={TAILS.map((t) => ({ value: t, label: t }))} />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: space(2) }}>
        <Button
          small
          variant={live ? "primary" : "secondary"}
          icon={live ? "pause" : "play"}
          title={live ? "Live" : "Paused"}
          onPress={() => setLive(!live)}
        />
        <Button small variant="secondary" icon="refresh" title="Refresh" onPress={() => logs.refetch()} loading={logs.isFetching && !live} />
        <Button
          small
          variant="secondary"
          icon="copy-outline"
          title="Copy"
          onPress={async () => {
            await Clipboard.setStringAsync(text);
            toast("Logs copied");
          }}
        />
      </View>

      {logs.isLoading ? <Loading /> : logs.error ? <ErrorView error={logs.error} onRetry={logs.refetch} /> : <LogView text={text} />}
    </View>
  );
}
