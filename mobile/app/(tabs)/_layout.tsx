import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { TabIcon } from "@/lib/icons";
import { haptics } from "@/lib/haptics";
import { colors, typography } from "@/lib/theme";

const isIOS = Platform.OS === "ios";

function TabBarBackground() {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: isIOS ? "rgba(255,253,249,0.92)" : "#fffdf9" }
      ]}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenListeners={{
        tabPress: () => haptics.selection()
      }}
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: "rgba(26,47,110,0.08)",
          backgroundColor: "transparent",
          height: isIOS ? 86 : 78,
          paddingTop: 10,
          paddingBottom: isIOS ? 28 : 12,
          elevation: 0
        },
        tabBarLabelStyle: {
          ...typography.bodyMedium,
          fontSize: 10.5,
          letterSpacing: 0.2,
          marginTop: 2
        },
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: "rgba(26,47,110,0.42)",
        sceneStyle: {
          backgroundColor: colors.ivory
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: "Match",
          tabBarIcon: ({ color }) => <TabIcon name="match" color={color} />
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Advisor",
          tabBarIcon: ({ color }) => <TabIcon name="advisor" color={color} />
        }}
      />
      <Tabs.Screen
        name="sop"
        options={{
          title: "SOP",
          tabBarIcon: ({ color }) => <TabIcon name="sop" color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabIcon name="profile" color={color} />
        }}
      />
    </Tabs>
  );
}
