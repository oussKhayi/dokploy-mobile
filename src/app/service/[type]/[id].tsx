import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Empty, ErrorView, Loading, Segmented } from "../../../components/ui";
import { DeploymentsTab } from "../../../components/service/DeploymentsTab";
import { DomainsTab } from "../../../components/service/DomainsTab";
import { EnvTab } from "../../../components/service/EnvTab";
import { LogsTab } from "../../../components/service/LogsTab";
import { OverviewTab } from "../../../components/service/OverviewTab";
import { useService } from "../../../lib/queries";
import { isServiceType, SERVICE_CONFIG } from "../../../lib/services";
import { space } from "../../../theme";

type TabKey = "overview" | "env" | "domains" | "deployments" | "logs";

export default function ServiceScreen() {
  const params = useLocalSearchParams<{ type: string; id: string; name?: string }>();
  const [tab, setTab] = useState<TabKey>("overview");

  if (!isServiceType(params.type)) return <Empty text="Unknown service type" />;
  const type = params.type;
  const cfg = SERVICE_CONFIG[type];

  const tabs: { value: TabKey; label: string }[] = [
    { value: "overview", label: "Overview" },
    { value: "env", label: "Env" },
    ...(cfg.hasDomains ? [{ value: "domains" as const, label: "Domains" }] : []),
    ...(cfg.hasDeployments ? [{ value: "deployments" as const, label: "Deploys" }] : []),
    { value: "logs", label: "Logs" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: params.name ?? cfg.label }} />
      <View style={{ paddingHorizontal: space(4), paddingTop: space(2), paddingBottom: space(1) }}>
        <Segmented options={tabs} value={tab} onChange={setTab} />
      </View>
      <ServiceBody type={type} id={params.id} tab={tab} />
    </View>
  );
}

function ServiceBody({ type, id, tab }: { type: Parameters<typeof useService>[0]; id: string; tab: TabKey }) {
  const { data, isLoading, error, refetch, isRefetching } = useService(type, id);
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorView error={error} onRetry={refetch} />;

  switch (tab) {
    case "overview":
      return <OverviewTab type={type} id={id} service={data} refreshing={isRefetching} onRefresh={() => void refetch()} />;
    case "env":
      return <EnvTab type={type} id={id} service={data} />;
    case "domains":
      return <DomainsTab type={type} id={id} service={data} />;
    case "deployments":
      return <DeploymentsTab type={type} id={id} />;
    case "logs":
      return <LogsTab type={type} id={id} service={data} />;
  }
}
