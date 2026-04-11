import { Text, View } from "react-native";
import { colors, typography } from "@/lib/theme";

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

export function SectionHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <View className="gap-2">
      <Text
        className="text-xs uppercase text-gold"
        style={[typography.bodySemiBold, typography.eyebrow]}
      >
        {eyebrow}
      </Text>
      <Text
        className="text-4xl text-charcoal"
        style={[typography.display, { lineHeight: 44 }]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-base leading-7" style={[typography.body, { color: colors.navy }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
