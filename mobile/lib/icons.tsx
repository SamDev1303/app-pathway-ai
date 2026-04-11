import { Platform } from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import {
  House,
  MessageCircleHeart,
  ScrollText,
  SearchCheck,
  UserRound,
  type LucideIcon
} from "lucide-react-native";

type TabIconKey = "home" | "match" | "advisor" | "sop" | "profile";

const symbolMap: Record<TabIconKey, SymbolViewProps["name"]> = {
  home: "house.fill",
  match: "sparkle.magnifyingglass",
  advisor: "text.bubble.fill",
  sop: "doc.text.fill",
  profile: "person.crop.circle.fill"
};

const lucideMap: Record<TabIconKey, LucideIcon> = {
  home: House,
  match: SearchCheck,
  advisor: MessageCircleHeart,
  sop: ScrollText,
  profile: UserRound
};

export function TabIcon({
  name,
  color,
  size = 26
}: {
  name: TabIconKey;
  color: string;
  size?: number;
}) {
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={symbolMap[name]}
        size={size}
        tintColor={color}
        weight="semibold"
        resizeMode="scaleAspectFit"
      />
    );
  }
  const Lucide = lucideMap[name];
  return <Lucide color={color} size={size - 2} strokeWidth={2.2} />;
}
