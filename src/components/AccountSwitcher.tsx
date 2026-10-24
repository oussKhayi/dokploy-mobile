import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAuth, type Account } from "../lib/auth";
import { colors, space } from "../theme";
import { Icon } from "./ui";

/** Header pill: shows the active account, opens the switcher. */
export function AccountSwitcher() {
  const { active } = useAuth();
  const router = useRouter();
  if (!active) return null;
  return (
    <Pressable
      onPress={() => router.push("/accounts")}
      hitSlop={8}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space(1.5),
        marginRight: space(3),
        paddingLeft: 3,
        paddingRight: space(2.5),
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surface2 : colors.surface,
        maxWidth: 170,
      })}
    >
      <AccountAvatar account={active} size={24} />
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600", flexShrink: 1 }} numberOfLines={1}>
        {active.name}
      </Text>
      <Icon name="chevron-down" size={14} color={colors.muted} />
    </Pressable>
  );
}

export function AccountAvatar({ account, size = 34 }: { account: Pick<Account, "name">; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: colors.text, fontWeight: "700", fontSize: size * 0.42 }}>
        {account.name.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}
