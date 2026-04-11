import { Tabs } from "expo-router";
import { House, MessageCircleHeart, ScrollText, SearchCheck, UserRound } from "lucide-react-native";
import { colors, typography } from "@/lib/theme";

const iconProps = { size: 20, strokeWidth: 2.2 };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fffdf9",
          borderTopColor: "rgba(26,47,110,0.08)",
          height: 78,
          paddingTop: 10,
          paddingBottom: 12
        },
        tabBarLabelStyle: {
          ...typography.bodyMedium,
          fontSize: 11
        },
        tabBarActiveTintColor: colors.gold,
        tabBarActiveBackgroundColor: colors.navy,
        tabBarInactiveTintColor: colors.navyMuted,
        sceneStyle: {
          backgroundColor: colors.ivory
        },
        tabBarItemStyle: {
          marginHorizontal: 4,
          borderRadius: 18
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <House
              {...iconProps}
              color={color}
              fill={focused ? "rgba(26,47,110,0.12)" : "transparent"}
            />
          )
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: "Match",
          tabBarIcon: ({ color, focused }) => (
            <SearchCheck
              {...iconProps}
              color={color}
              fill={focused ? "rgba(26,47,110,0.12)" : "transparent"}
            />
          )
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Advisor",
          tabBarIcon: ({ color, focused }) => (
            <MessageCircleHeart
              {...iconProps}
              color={color}
              fill={focused ? "rgba(26,47,110,0.12)" : "transparent"}
            />
          )
        }}
      />
      <Tabs.Screen
        name="sop"
        options={{
          title: "SOP",
          tabBarIcon: ({ color, focused }) => (
            <ScrollText
              {...iconProps}
              color={color}
              fill={focused ? "rgba(26,47,110,0.12)" : "transparent"}
            />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <UserRound
              {...iconProps}
              color={color}
              fill={focused ? "rgba(26,47,110,0.12)" : "transparent"}
            />
          )
        }}
      />
    </Tabs>
  );
}
