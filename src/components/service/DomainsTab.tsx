import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useApi } from "../../lib/auth";
import { useAction } from "../../lib/hooks";
import { keys } from "../../lib/queries";
import type { Domain, ServiceDetail, ServiceType } from "../../lib/types";
import { colors, space } from "../../theme";
import { Button, Card, Empty, ErrorView, Field, Icon, Loading, Row, SectionTitle, Segmented, Tag, ToggleRow } from "../ui";

type Props = { type: ServiceType; id: string; service: ServiceDetail };

type Draft = {
  domainId?: string;
  host: string;
  path: string;
  port: string;
  https: boolean;
  certificateType: "letsencrypt" | "none";
  serviceName: string;
};

const blank: Draft = { host: "", path: "/", port: "3000", https: true, certificateType: "letsencrypt", serviceName: "" };

export function DomainsTab({ type, id, service }: Props) {
  const api = useApi();
  const isCompose = type === "compose";
  const qk = [...keys.domains(type, id)];
  const domains = useQuery({
    queryKey: qk,
    queryFn: () =>
      api.query<Domain[]>(isCompose ? "domain.byComposeId" : "domain.byApplicationId", {
        [isCompose ? "composeId" : "applicationId"]: id,
      }),
  });
  const composeServices = useQuery({
    queryKey: ["composeServices", id],
    enabled: isCompose,
    queryFn: () => api.query<string[]>("compose.loadServices", { composeId: id, type: "cache" }),
  });
  const action = useAction({ invalidate: [qk] });
  const [draft, setDraft] = useState<Draft | null>(null);

  if (domains.isLoading) return <Loading />;
  if (domains.error) return <ErrorView error={domains.error} onRetry={domains.refetch} />;

  const save = () => {
    if (!draft) return;
    const body: Record<string, unknown> = {
      host: draft.host.trim(),
      path: draft.path || "/",
      port: Number(draft.port) || undefined,
      https: draft.https,
      certificateType: draft.https ? draft.certificateType : "none",
    };
    if (isCompose) body.serviceName = draft.serviceName;
    if (draft.domainId) {
      body.domainId = draft.domainId;
      if (isCompose) body.domainType = "compose";
    } else {
      body.domainType = isCompose ? "compose" : "application";
      body[isCompose ? "composeId" : "applicationId"] = id;
    }
    action.mutate(
      {
        procedure: draft.domainId ? "domain.update" : "domain.create",
        input: body,
        success: draft.domainId ? "Domain updated" : "Domain added",
      },
      { onSuccess: (r) => !r.skipped && setDraft(null) },
    );
  };

  if (draft) {
    const set = (p: Partial<Draft>) => setDraft({ ...draft, ...p });
    const services = Array.isArray(composeServices.data) ? composeServices.data : [];
    return (
      <ScrollView contentContainerStyle={{ padding: space(4), gap: space(4), paddingBottom: space(10) }}>
        <Field label="Host" placeholder="app.example.com" value={draft.host} onChangeText={(host) => set({ host })} keyboardType="url" />
        <View style={{ flexDirection: "row", gap: space(3) }}>
          <View style={{ flex: 1 }}>
            <Field label="Path" value={draft.path} onChangeText={(path) => set({ path })} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Container port" value={draft.port} onChangeText={(port) => set({ port })} keyboardType="number-pad" />
          </View>
        </View>
        {isCompose ? (
          <View style={{ gap: space(2) }}>
            <Text style={{ color: colors.text, fontWeight: "500" }}>Compose service</Text>
            {services.length ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
                {services.map((name) => (
                  <Pressable key={name} onPress={() => set({ serviceName: name })}>
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: draft.serviceName === name ? colors.text : colors.border,
                        backgroundColor: draft.serviceName === name ? colors.surface2 : "transparent",
                      }}
                    >
                      <Text style={{ color: colors.text, fontSize: 13 }}>{name}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Field label="" placeholder="service name" value={draft.serviceName} onChangeText={(serviceName) => set({ serviceName })} />
            )}
          </View>
        ) : null}
        <Card>
          <ToggleRow label="HTTPS" value={draft.https} onChange={(https) => set({ https })} />
        </Card>
        {draft.https ? (
          <View style={{ gap: space(2) }}>
            <Text style={{ color: colors.text, fontWeight: "500" }}>Certificate</Text>
            <Segmented
              value={draft.certificateType}
              onChange={(certificateType) => set({ certificateType })}
              options={[
                { value: "letsencrypt", label: "Let's Encrypt" },
                { value: "none", label: "None" },
              ]}
            />
          </View>
        ) : null}
        <Button
          title={draft.domainId ? "Update domain" : "Add domain"}
          onPress={save}
          loading={action.isPending}
          disabled={!draft.host || (isCompose && !draft.serviceName)}
        />
        <Button title="Cancel" variant="ghost" onPress={() => setDraft(null)} />
        <Text style={{ color: colors.faint, fontSize: 12, textAlign: "center" }}>
          Point the DNS record to your server first. Changes apply on the next deploy for some setups.
        </Text>
      </ScrollView>
    );
  }

  const list = domains.data ?? [];
  return (
    <ScrollView
      contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }}
      refreshControl={<RefreshControl refreshing={domains.isRefetching} onRefresh={() => void domains.refetch()} tintColor={colors.muted} />}
    >
      <SectionTitle right={<Button title="Add" icon="add" small variant="secondary" onPress={() => setDraft({ ...blank })} />}>
        {`${list.length} domain${list.length === 1 ? "" : "s"}`}
      </SectionTitle>
      {list.length === 0 ? (
        <Empty icon="globe-outline" text={`No domains for ${service.name}`} />
      ) : (
        <Card>
          {list.map((d) => {
            const url = `${d.https ? "https" : "http"}://${d.host}${d.path && d.path !== "/" ? d.path : ""}`;
            return (
              <Row
                key={d.domainId}
                title={d.host}
                subtitle={[d.serviceName, d.port ? `port ${d.port}` : null, d.path !== "/" ? d.path : null].filter(Boolean).join(" · ")}
                left={<Icon name={d.https ? "lock-closed-outline" : "globe-outline"} color={colors.muted} />}
                right={
                  <View style={{ flexDirection: "row", gap: space(3), alignItems: "center" }}>
                    {d.certificateType === "letsencrypt" ? <Tag>SSL</Tag> : null}
                    <Pressable hitSlop={10} onPress={() => Linking.openURL(url)}>
                      <Icon name="open-outline" color={colors.muted} />
                    </Pressable>
                    <Pressable
                      hitSlop={10}
                      onPress={() =>
                        action.mutate({
                          procedure: "domain.delete",
                          input: { domainId: d.domainId },
                          confirm: `Delete ${d.host}?`,
                          destructive: true,
                          success: "Domain deleted",
                        })
                      }
                    >
                      <Icon name="trash-outline" color={colors.danger} />
                    </Pressable>
                  </View>
                }
                chevron={false}
                onPress={() =>
                  setDraft({
                    domainId: d.domainId,
                    host: d.host,
                    path: d.path ?? "/",
                    port: d.port ? String(d.port) : "",
                    https: d.https,
                    certificateType: d.certificateType === "letsencrypt" ? "letsencrypt" : "none",
                    serviceName: d.serviceName ?? "",
                  })
                }
              />
            );
          })}
        </Card>
      )}
    </ScrollView>
  );
}
