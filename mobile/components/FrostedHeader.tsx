import { ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography } from "@/lib/theme";

const isIOS = Platform.OS === "ios";

export function FrostedHeader({
  eyebrow,
  title,
  trailing,
  tint = "light"
}: {
  eyebrow?: string;
  title: string;
  trailing?: ReactNode;
  tint?: "light" | "dark";
}) {
  const insets = useSafeAreaInsets();
  const Wrapper = isIOS ? BlurView : View;
  const wrapperProps = isIOS
    ? { intensity: 88, tint: "systemChromeMaterialLight" as const }
    : { style: { backgroundColor: "rgba(255,253,249,0.98)" } };

  return (
    <Wrapper
      {...wrapperProps}
      style={[
        styles.wrapper,
        { paddingTop: insets.top + 8 },
        isIOS ? null : { backgroundColor: "rgba(255,253,249,0.98)" }
      ]}
    >
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          {eyebrow ? (
            <Text
              style={[
                typography.bodySemiBold,
                typography.eyebrow,
                {
                  color: tint === "dark" ? "#fff1c5" : colors.gold,
                  fontSize: 11,
                  textTransform: "uppercase"
                }
              ]}
            >
              {eyebrow}
            </Text>
          ) : null}
          <Text
            style={[
              typography.display,
              {
                color: tint === "dark" ? "#fff" : colors.charcoal,
                fontSize: 28,
                lineHeight: 32,
                marginTop: eyebrow ? 4 : 0
              }
            ]}
          >
            {title}
          </Text>
        </View>
        {trailing ? <View style={{ marginLeft: 12 }}>{trailing}</View> : null}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(26,47,110,0.10)"
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end"
  }
});
