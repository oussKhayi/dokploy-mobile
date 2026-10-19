import * as Clipboard from "expo-clipboard";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useAction, toast } from "../../lib/hooks";
import { keys } from "../../lib/queries";
import { ACTION_META, SERVICE_CONFIG } from "../../lib/services";
import { timeAgo } from "../../lib/format";
import type { ServiceDetail, ServiceType } from "../../lib/types";
import { colors, space } from "../../theme";
import { Button, Card, Row, SectionTitle, StatusBadge } from "../ui";

type Props = {
  type: ServiceType;
  id: string;
  service: ServiceDetail;
  refreshing: boolean;
  onRefresh: () => void;
};

export function OverviewTab({ type, id, service, refreshing, onRefresh }: Props) {
  const cfg = SERVICE_CONFIG[type];
  const action = useAction({ invalidate: [[...keys.service(type, id)], [...keys.projects], ["deployments", type, id]] });
  const status = service.applicationStatus ?? service.composeStatus;

  const run = (key: (typeof cfg.actions)[number]) => {
    const meta = ACTION_META[key];
    const input: Record<string, unknown> = { [cfg.idKey]: id };
    if (key === "reload") input.appName = service.appName;
    action.mutate({
      procedure: `${type}.${key}`,
      input,
      confirm: meta.confirm,
      destructive: key === "stop",
      success: `${meta.label} requested`,
    });
  };

  const info: [string, string | null | undefined][] = [
    ["App name", service.appName],
    ["Type", cfg.label + (service.composeType ? ` (${service.composeType})` : "")],
    ["Source", service.sourceType],
    ["Repository", service.repository ? `${service.owner ? service.owner + "/" : ""}${service.repository}` : service.customGitUrl],
    ["Branch", service.branch ?? service.customGitBranch],
    ["Docker image", service.dockerImage],
    ["Build type", service.buildType],
    ["Database", service.databaseName],
    ["DB user", service.databaseUser],
    ["External port", service.externalPort ? String(service.externalPort) : null],
    ["Auto deploy", service.autoDeploy == null ? null : service.autoDeploy ? "On" : "Off"],
    ["Created", timeAgo(service.createdAt)],
  ];

  return (
    <ScrollView
      contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.muted} />}
    >
      <Card style={{ padding: space(4), gap: space(3) }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", flex: 1 }} numberOfLines={1}>
            {service.name}
          </Text>
          <StatusBadge status={status} />
        </View>
        {service.description ? <Text style={{ color: colors.muted }}>{service.description}</Text> : null}
        {service.environment?.project ? (
          <Text style={{ color: colors.faint, fontSize: 12 }}>
            {service.environment.project.name} / {service.environment.name}
          </Text>
        ) : null}
      </Card>

      <SectionTitle>Actions</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
        {cfg.actions.map((key) => (
          <Button
            key={key}
            title={ACTION_META[key].label}
            icon={ACTION_META[key].icon}
            variant={key === "deploy" ? "primary" : key === "stop" ? "danger" : "secondary"}
            onPress={() => run(key)}
            loading={action.isPending && action.variables?.procedure === `${type}.${key}`}
            style={{ flexGrow: 1, minWidth: "30%" }}
            small
          />
        ))}
      </View>

      <SectionTitle>Details</SectionTitle>
      <Card>
        {info
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <Row
              key={k}
              title={k}
              subtitle={String(v)}
              onPress={async () => {
                await Clipboard.setStringAsync(String(v));
                toast("Copied");
              }}
              chevron={false}
            />
          ))}
      </Card>
    </ScrollView>
  );
}
