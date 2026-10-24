import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Linking, RefreshControl, ScrollView, Text } from "react-native";
import { Button, Card, Icon, Row, SectionTitle } from "../../components/ui";
import { useAuth, useApi } from "../../lib/auth";
import { confirm, useAction } from "../../lib/hooks";
import { colors, space } from "../../theme";

const REPO_URL = "https://github.com/oussKhayi/dokploy-mobile";

const MAINTENANCE: { procedure: string; label: string; icon: string; confirm: string }[] = [
  { procedure: "settings.reloadTraefik", label: "Reload Traefik", icon: "git-network-outline", confirm: "Reload Traefik? Routing may blip for a moment." },
  { procedure: "settings.cleanUnusedImages", label: "Clean unused images", icon: "images-outline", confirm: "Remove unused Docker images?" },
  { procedure: "settings.cleanStoppedContainers", label: "Clean stopped containers", icon: "cube-outline", confirm: "Remove stopped containers?" },
  { procedure: "settings.cleanUnusedVolumes", label: "Clean unused volumes", icon: "albums-outline", confirm: "Remove unused volumes? Data in them is lost." },
  { procedure: "settings.cleanAll", label: "Clean all", icon: "sparkles-outline", confirm: "Run every Docker cleanup now?" },
];

export default function Settings() {
  const { creds, active, accounts, removeAccount } = useAuth();
  const router = useRouter();
  const api = useApi();
  const version = useQuery({ queryKey: ["version"], queryFn: () => api.query<string>("settings.getDokployVersion") });
  const ip = useQuery({ queryKey: ["ip"], queryFn: () => api.query<string>("settings.getIp") });
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api.query<{ role: string; user: { email: string } }>("user.get"),
  });
  const action = useAction();

  const refresh = () => {
    void version.refetch();
    void ip.refetch();
    void me.refetch();
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: space(4), paddingBottom: space(12) }}
      refreshControl={<RefreshControl refreshing={version.isRefetching} onRefresh={refresh} tintColor={colors.muted} />}
    >
      <SectionTitle>Account</SectionTitle>
      <Card>
        <Row
          title={active?.name ?? "Account"}
          subtitle={`${accounts.length} saved account${accounts.length === 1 ? "" : "s"} · tap to switch`}
          left={<Icon name="swap-horizontal-outline" color={colors.muted} />}
          onPress={() => router.push("/accounts")}
        />
        <Row title="Add account" left={<Icon name="add-circle-outline" color={colors.muted} />} onPress={() => router.push("/accounts/add")} />
      </Card>

      <SectionTitle>Instance</SectionTitle>
      <Card>
        <Row title="URL" subtitle={creds?.url} left={<Icon name="link-outline" color={colors.muted} />} onPress={() => creds && Linking.openURL(creds.url)} />
        <Row title="Dokploy version" subtitle={version.data ?? (version.error ? "Unavailable" : "...")} left={<Icon name="pricetag-outline" color={colors.muted} />} />
        <Row title="Server IP" subtitle={ip.data || "Not set"} left={<Icon name="globe-outline" color={colors.muted} />} />
        <Row
          title="Signed in as"
          subtitle={me.data ? `${me.data.user.email} (${me.data.role})` : "..."}
          left={<Icon name="person-circle-outline" color={colors.muted} />}
        />
      </Card>

      <SectionTitle>Docker</SectionTitle>
      <Card>
        <Row
          title="Containers"
          subtitle="All containers on the server: restart, start, stop"
          left={<Icon name="cube-outline" color={colors.muted} />}
          onPress={() => router.push("/containers")}
        />
      </Card>

      <SectionTitle>Maintenance</SectionTitle>
      <Card>
        {MAINTENANCE.map((m) => (
          <Row
            key={m.procedure}
            title={m.label}
            left={<Icon name={m.icon} color={colors.muted} />}
            onPress={() =>
              action.mutate({ procedure: m.procedure, input: {}, confirm: m.confirm, success: `${m.label} started` })
            }
          />
        ))}
      </Card>
      <Text style={{ color: colors.faint, fontSize: 12, marginTop: space(2) }}>Requires an admin or owner API key.</Text>

      <SectionTitle>App</SectionTitle>
      <Card>
        <Row title="Version" subtitle={Constants.expoConfig?.version} left={<Icon name="phone-portrait-outline" color={colors.muted} />} />
        <Row title="Source code" subtitle="Open source on GitHub" left={<Icon name="logo-github" color={colors.muted} />} onPress={() => Linking.openURL(REPO_URL)} />
      </Card>

      <Button
        title="Remove this account"
        icon="log-out-outline"
        variant="danger"
        style={{ marginTop: space(6) }}
        onPress={async () => {
          if (active && (await confirm(`Remove ${active.name}?`, "Its API key will be deleted from this device.", true)))
            await removeAccount(active.id);
        }}
      />
    </ScrollView>
  );
}
