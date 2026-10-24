import { Text, View } from "react-native";
import { timeAgo } from "../../lib/format";
import { useAction } from "../../lib/hooks";
import { keys } from "../../lib/queries";
import type { ServiceType } from "../../lib/types";
import { colors, space } from "../../theme";
import { Button, Card, Row, SectionTitle, StatusDot, Tag } from "../ui";

export type Backup = {
  backupId: string;
  schedule: string;
  enabled: boolean | null;
  database: string;
  prefix: string;
  destination?: { name?: string } | null;
  deployments?: { status: string; createdAt: string }[];
};

const MANUAL: Partial<Record<ServiceType, string>> = {
  postgres: "backup.manualBackupPostgres",
  mysql: "backup.manualBackupMySql",
  mariadb: "backup.manualBackupMariadb",
  mongo: "backup.manualBackupMongo",
  libsql: "backup.manualBackupLibsql",
  compose: "backup.manualBackupCompose",
};

export function BackupsSection({ type, id, backups }: { type: ServiceType; id: string; backups?: Backup[] }) {
  const procedure = MANUAL[type];
  const action = useAction({ invalidate: [[...keys.service(type, id)]] });
  if (!procedure || !backups) return null;

  return (
    <View>
      <SectionTitle>Backups</SectionTitle>
      {backups.length === 0 ? (
        <Text style={{ color: colors.faint, fontSize: 13, paddingHorizontal: space(1) }}>
          No backups configured. Set one up in the Dokploy dashboard to run it from here.
        </Text>
      ) : (
        <Card>
          {backups.map((b) => {
            const last = [...(b.deployments ?? [])].sort((x, y) => y.createdAt.localeCompare(x.createdAt))[0];
            return (
              <Row
                key={b.backupId}
                title={`${b.database} · ${b.schedule}`}
                subtitle={[b.destination?.name, last ? `last ${timeAgo(last.createdAt)}` : "never run"].filter(Boolean).join(" · ")}
                left={<StatusDot status={last ? (last.status === "error" ? "error" : "done") : "idle"} />}
                right={
                  <View style={{ flexDirection: "row", gap: space(2), alignItems: "center" }}>
                    {b.enabled === false ? <Tag>off</Tag> : null}
                    <Button
                      small
                      variant="secondary"
                      icon="cloud-upload-outline"
                      title="Run"
                      loading={action.isPending && action.variables?.input?.backupId === b.backupId}
                      onPress={() =>
                        action.mutate({
                          procedure,
                          input: { backupId: b.backupId },
                          confirm: `Run backup of ${b.database} now?`,
                          success: "Backup started",
                        })
                      }
                    />
                  </View>
                }
                chevron={false}
              />
            );
          })}
        </Card>
      )}
    </View>
  );
}
