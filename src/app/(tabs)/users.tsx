import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { Card, Empty, ErrorView, Icon, Loading, Row, Tag } from "../../components/ui";
import { useApi } from "../../lib/auth";
import { timeAgo } from "../../lib/format";
import { keys } from "../../lib/queries";
import type { Member } from "../../lib/types";
import { colors, space } from "../../theme";

export default function Users() {
  const api = useApi();
  const router = useRouter();
  const q = useQuery({ queryKey: [...keys.members], queryFn: () => api.query<Member[]>("user.all") });

  return (
    <>
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorView error={q.error} onRetry={q.refetch} />
      ) : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: space(4), gap: space(3), paddingBottom: space(24) }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.muted} />}
          ListEmptyComponent={<Empty icon="people-outline" text="No users" />}
          renderItem={({ item }) => {
            const name = [item.user.firstName, item.user.lastName].filter(Boolean).join(" ");
            return (
              <Card>
                <Row
                  title={name || item.user.email}
                  subtitle={name ? item.user.email : `Joined ${timeAgo(item.createdAt)}`}
                  left={<Avatar email={item.user.email} />}
                  right={<Tag>{item.role}</Tag>}
                  onPress={() => router.push({ pathname: "/user/[memberId]", params: { memberId: item.id } })}
                />
              </Card>
            );
          }}
        />
      )}
      <Pressable
        onPress={() => router.push("/user/new")}
        style={({ pressed }) => ({
          position: "absolute",
          right: space(5),
          bottom: space(5),
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.8 : 1,
          elevation: 4,
        })}
      >
        <Icon name="person-add" color={colors.onPrimary} size={22} />
      </Pressable>
    </>
  );
}

function Avatar({ email }: { email: string }) {
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.surface2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: colors.text, fontWeight: "700" }}>{email.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}
