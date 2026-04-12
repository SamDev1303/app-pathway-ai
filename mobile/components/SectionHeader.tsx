import { Text, View } from "react-native";
import { colors, typography } from "@/lib/theme";

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

export function SectionHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={[
          typography.bodySemiBold,
          typography.eyebrow,
          { fontSize: 12, textTransform: "uppercase", color: colors.gold }
        ]}
      >
        {eyebrow}
      </Text>
      <Text
        style={[
          typography.display,
          { fontSize: 34, lineHeight: 44, color: colors.charcoal }
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={[typography.body, { fontSize: 16, lineHeight: 28, color: colors.navy }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
