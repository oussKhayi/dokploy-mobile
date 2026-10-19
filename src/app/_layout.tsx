import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { AuthProvider, useAuth } from "../lib/auth";
import { Loading } from "../components/ui";
import { colors } from "../theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000 },
  },
});

function RootStack() {
  const { ready, creds } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Loading />
      </View>
    );
  }
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={!!creds}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="project/[projectId]" options={{ title: "Project" }} />
        <Stack.Screen name="service/[type]/[id]" options={{ title: "Service" }} />
        <Stack.Screen name="deployment/[deploymentId]" options={{ title: "Deployment logs" }} />
        <Stack.Screen name="user/[memberId]" options={{ title: "User" }} />
        <Stack.Screen name="user/new" options={{ title: "Add user", presentation: "modal" }} />
      </Stack.Protected>
      <Stack.Protected guard={!creds}>
        <Stack.Screen name="connect" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <RootStack />
      </AuthProvider>
    </QueryClientProvider>
  );
}
