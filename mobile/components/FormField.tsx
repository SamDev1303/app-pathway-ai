import { Text, TextInput, TextInputProps, View } from "react-native";
import { colors, typography } from "@/lib/theme";

type Props = TextInputProps & {
  label: string;
  hint?: string;
};

export function FormField({ label, hint, multiline, style, ...props }: Props) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={[
          typography.bodySemiBold,
          typography.eyebrow,
          { fontSize: 12, textTransform: "uppercase", color: colors.gold }
        ]}
      >
        {label}
      </Text>
      <TextInput
        multiline={multiline}
        placeholderTextColor="rgba(26,47,110,0.45)"
        style={[
          typography.body,
          {
            minHeight: multiline ? 120 : 56,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: "rgba(255,255,255,0.84)",
            paddingHorizontal: 18,
            paddingVertical: multiline ? 18 : 14,
            color: colors.charcoal
          },
          style
        ]}
        {...props}
      />
      {hint ? (
        <Text style={[typography.body, { color: colors.navyMuted, fontSize: 12 }]}>{hint}</Text>
      ) : null}
    </View>
  );
}
