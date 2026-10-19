import { Tabs } from "expo-router";
import { Icon } from "../../components/ui";
import { colors } from "../../theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.faint,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Projects",
          tabBarIcon: ({ color, size }) => <Icon name="folder-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => <Icon name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Server",
          tabBarIcon: ({ color, size }) => <Icon name="hardware-chip-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
