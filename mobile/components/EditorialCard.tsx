import { PropsWithChildren } from "react";
import { View } from "react-native";
import { colors, radius, shadow } from "@/lib/theme";

export function EditorialCard({ children }: PropsWithChildren) {
  return (
    <View style={[shadow.card, { borderRadius: radius.md }]}>
      <View
        style={{
          overflow: "hidden",
          backgroundColor: colors.white,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.line
        }}
      >
        {children}
      </View>
    </View>
  );
}
