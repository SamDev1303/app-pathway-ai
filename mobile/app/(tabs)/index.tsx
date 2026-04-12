import { ScrollView, Text, View } from "react-native";
import { Image, ImageBackground } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowUpRight, CircleAlert, Sparkles } from "lucide-react-native";
import { EditorialCard } from "@/components/EditorialCard";
import { ScoreRing } from "@/components/ScoreRing";
import { SectionHeader } from "@/components/SectionHeader";
import { advisorTip, universities, visaUpdate } from "@/lib/mockData";
import { colors, typography } from "@/lib/theme";

const topMatch = universities[0];

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {/* Hero card */}
          <View
            style={{
              marginTop: 8,
              overflow: "hidden",
              borderRadius: 30,
              borderWidth: 1,
              borderColor: "#e5ddc8"
            }}
          >
            <ImageBackground
              source={{ uri: topMatch.image }}
              style={{ height: 360, justifyContent: "space-between", borderRadius: 30 }}
              contentFit="cover"
              transition={300}
            >
              <View style={{ backgroundColor: "rgba(26,47,110,0.45)", paddingHorizontal: 24, paddingBottom: 24, paddingTop: 20 }}>
                <Text
                  style={[
                    typography.bodySemiBold,
                    typography.eyebrow,
                    { fontSize: 12, textTransform: "uppercase", color: "#f8d585" }
                  ]}
                >
                  UniMate Australia
                </Text>
                <Text
                  style={[
                    typography.display,
                    { marginTop: 16, maxWidth: "82%", fontSize: 40, lineHeight: 44, color: "#ffffff" }
                  ]}
                >
                  Study migration, treated like a life editorial.
                </Text>
              </View>

              <View
                style={{
                  margin: 20,
                  borderRadius: 28,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.20)",
                  backgroundColor: "rgba(250,248,243,0.92)",
                  padding: 20
                }}
              >
                <Text
                  style={[
                    typography.bodySemiBold,
                    typography.eyebrow,
                    { fontSize: 12, textTransform: "uppercase", color: colors.gold }
                  ]}
                >
                  Today&apos;s Match
                </Text>
                <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ maxWidth: "72%", gap: 8 }}>
                    <Text style={[typography.display, { fontSize: 30, lineHeight: 34, color: colors.charcoal }]}>
                      {topMatch.university}
                    </Text>
                    <Text style={[typography.bodyMedium, { fontSize: 16, color: "#30498f" }]}>
                      {topMatch.course}
                    </Text>
                    <Text style={[typography.body, { fontSize: 14, lineHeight: 24, color: "rgba(26,26,26,0.80)" }]}>
                      {topMatch.summary}
                    </Text>
                  </View>
                  <ScoreRing score={topMatch.score} />
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* Section header */}
          <View style={{ marginTop: 32 }}>
            <SectionHeader
              eyebrow="Curated for today"
              title="A warmer way to compare options."
              subtitle="Not a grid of widgets. A quiet feed of the decisions, signals, and next steps that matter most."
            />
          </View>

          {/* Editorial cards */}
          <View style={{ marginTop: 24, gap: 20 }}>
            {/* Advisor tip card */}
            <EditorialCard>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.cream,
                  paddingHorizontal: 20,
                  paddingVertical: 16
                }}
              >
                <View style={{ maxWidth: "80%" }}>
                  <Text
                    style={[
                      typography.bodySemiBold,
                      typography.eyebrow,
                      { fontSize: 12, textTransform: "uppercase", color: colors.gold }
                    ]}
                  >
                    AI advisor tip of the day
                  </Text>
                  <Text style={[typography.display, { marginTop: 8, fontSize: 24, lineHeight: 28, color: colors.charcoal }]}>
                    Build a smarter shortlist.
                  </Text>
                </View>
                <Sparkles color={colors.gold} size={22} strokeWidth={2} />
              </View>
              <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
                <Text style={[typography.body, { fontSize: 16, lineHeight: 32, color: "rgba(26,26,26,0.85)" }]}>
                  {advisorTip}
                </Text>
              </View>
            </EditorialCard>

            {/* Visa update card */}
            <EditorialCard>
              <View style={{ flexDirection: "row" }}>
                <Image
                  source={{ uri: universities[4].image }}
                  style={{ height: 180, width: "34%" }}
                  contentFit="cover"
                  transition={300}
                />
                <View style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 20 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text
                      style={[
                        typography.bodySemiBold,
                        typography.eyebrow,
                        { fontSize: 12, textTransform: "uppercase", color: colors.gold }
                      ]}
                    >
                      Visa update
                    </Text>
                    <CircleAlert color={colors.navy} size={18} />
                  </View>
                  <Text style={[typography.display, { marginTop: 12, fontSize: 30, lineHeight: 34, color: colors.charcoal }]}>
                    Clearer story, stronger file.
                  </Text>
                  <Text style={[typography.body, { marginTop: 12, fontSize: 14, lineHeight: 28, color: "rgba(26,26,26,0.80)" }]}>
                    {visaUpdate.body}
                  </Text>
                  <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[typography.bodySemiBold, { fontSize: 14, color: "#30498f" }]}>
                      Read how UniMate frames this
                    </Text>
                    <ArrowUpRight color={colors.gold} size={16} />
                  </View>
                </View>
              </View>
            </EditorialCard>

            {/* Why this app card */}
            <EditorialCard>
              <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
                <Text
                  style={[
                    typography.bodySemiBold,
                    typography.eyebrow,
                    { fontSize: 12, textTransform: "uppercase", color: colors.gold }
                  ]}
                >
                  Why this app
                </Text>
                <Text style={[typography.display, { marginTop: 12, fontSize: 30, lineHeight: 34, color: colors.charcoal }]}>
                  Prestige, budget, English, migration fit.
                </Text>
                <Text style={[typography.body, { marginTop: 12, fontSize: 16, lineHeight: 32, color: "rgba(26,26,26,0.80)" }]}>
                  UniMate folds your study ambition, budget comfort, IELTS reality, and PR intent into one narrative-friendly recommendation flow. The point is not more choices. The point is better choices.
                </Text>
              </View>
            </EditorialCard>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
