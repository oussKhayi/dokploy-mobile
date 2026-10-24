import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { AccountAvatar } from "../../components/AccountSwitcher";
import { Button, Card, Icon, Row, SectionTitle, Tag } from "../../components/ui";
import { hostOf, useAuth, type Account } from "../../lib/auth";
import { confirm, toast } from "../../lib/hooks";
import { colors, radius, space } from "../../theme";

export default function Accounts() {
  const router = useRouter();
  const { accounts, active, switchAccount, removeAccount, renameAccount } = useAuth();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const choose = async (a: Account) => {
    if (a.id === active?.id) return router.back();
    // Switching remounts the navigator, which lands on the projects tab
    await switchAccount(a.id);
    toast(`Switched to ${a.name}`);
  };

  const more = (a: Account) =>
    Alert.alert(a.name, a.email ?? hostOf(a.url), [
      {
        text: "Rename",
        onPress: () => {
          setDraft(a.name);
          setEditing(a.id);
        },
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (await confirm(`Remove ${a.name}?`, "Its API key is deleted from this device.", true)) {
            await removeAccount(a.id);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(12) }}>
      <SectionTitle>{`${accounts.length} account${accounts.length === 1 ? "" : "s"}`}</SectionTitle>
      <Card>
        {accounts.map((a) =>
          editing === a.id ? (
            <View key={a.id} style={{ flexDirection: "row", gap: space(2), padding: space(3), alignItems: "center" }}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                autoFocus
                style={{
                  flex: 1,
                  color: colors.text,
                  backgroundColor: colors.surface2,
                  borderRadius: radius.sm,
                  paddingHorizontal: space(3),
                  paddingVertical: space(2),
                }}
              />
              <Button
                small
                title="Save"
                onPress={async () => {
                  await renameAccount(a.id, draft);
                  setEditing(null);
                }}
              />
            </View>
          ) : (
            <Row
              key={a.id}
              title={a.name}
              subtitle={[a.email, hostOf(a.url)].filter(Boolean).join(" · ")}
              left={<AccountAvatar account={a} />}
              right={
                <View style={{ flexDirection: "row", alignItems: "center", gap: space(3) }}>
                  {a.id === active?.id ? <Icon name="checkmark-circle" color={colors.success} size={20} /> : null}
                  {a.role ? <Tag>{a.role}</Tag> : null}
                  <Pressable hitSlop={12} onPress={() => more(a)}>
                    <Icon name="ellipsis-vertical" color={colors.muted} />
                  </Pressable>
                </View>
              }
              chevron={false}
              onPress={() => choose(a)}
            />
          ),
        )}
      </Card>
      <Button
        title="Add account"
        icon="add"
        variant="secondary"
        style={{ marginTop: space(4) }}
        onPress={() => router.push("/accounts/add")}
      />
      <Text style={{ color: colors.faint, fontSize: 12, marginTop: space(3), textAlign: "center" }}>
        Add several servers, or several users on one server, and switch in one tap.
      </Text>
    </ScrollView>
  );
}
