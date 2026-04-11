import { Text, View } from "react-native";
import { colors, typography } from "@/lib/theme";

export function ScoreRing({ score, size = 74 }: { score: number; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: colors.gold,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.92)"
      }}
    >
      <Text style={[typography.bodyBold, { color: colors.navy, fontSize: size * 0.28 }]}>
        {score}
      </Text>
      <Text style={[typography.bodyMedium, { color: colors.gold, fontSize: size * 0.12 }]}>
        match
      </Text>
    </View>
  );
}
