import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { cleanLogs, LogView } from "../../components/LogView";
import { Button, ErrorView, Loading } from "../../components/ui";
import { useApi } from "../../lib/auth";
import { toast } from "../../lib/hooks";
import { space } from "../../theme";

export default function DeploymentLogs() {
  const { deploymentId, status } = useLocalSearchParams<{ deploymentId: string; status?: string }>();
  const api = useApi();
  const [live, setLive] = useState(status === "running");
  const q = useQuery({
    queryKey: ["deploymentLogs", deploymentId],
    queryFn: () => api.query<string>("deployment.readLogs", { deploymentId, tail: 5000 }),
    refetchInterval: live ? 3000 : false,
  });

  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorView error={q.error} onRetry={q.refetch} />;
  const text = cleanLogs(q.data);

  return (
    <View style={{ flex: 1, padding: space(3), gap: space(3) }}>
      <View style={{ flexDirection: "row", gap: space(2) }}>
        <Button
          small
          variant={live ? "primary" : "secondary"}
          icon={live ? "pause" : "play"}
          title={live ? "Live" : "Paused"}
          onPress={() => setLive(!live)}
        />
        <Button small variant="secondary" icon="refresh" title="Refresh" onPress={() => q.refetch()} loading={q.isRefetching} />
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
      <LogView text={text} />
    </View>
  );
}
