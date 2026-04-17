import { Tabs } from "expo-router";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { useSettings } from "../../../src/contexts/SettingsContext";

export default function TabLayout() {
  const { colors } = useTheme();
  const { settings } = useSettings();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <TabIcon name="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => <TabIcon name="📅" color={color} />,
        }}
      />
      {settings.toolsTabEnabled !== false && (
        <Tabs.Screen
          name="tools"
          options={{
            title: "Tools",
            tabBarIcon: ({ color }) => <TabIcon name="🛠️" color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="organizations"
        options={{
          title: "Organizations",
          tabBarIcon: ({ color }) => <TabIcon name="🏢" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabIcon name="👤" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <TabIcon name="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}

import { Text } from "react-native";

function TabIcon({ name, color }: { name: string; color: string }) {
  return <Text style={{ fontSize: 24, color }}>{name}</Text>;
}
