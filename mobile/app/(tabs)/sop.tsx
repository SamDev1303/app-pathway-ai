import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EditorialCard } from "@/components/EditorialCard";
import { FormField } from "@/components/FormField";
import { SectionHeader } from "@/components/SectionHeader";
import { sopTemplate, universities } from "@/lib/mockData";
import { haptics } from "@/lib/haptics";
import { colors, typography } from "@/lib/theme";

const steps = ["Target", "Background", "Goals", "Generate"];

export default function SopScreen() {
  const [step, setStep] = useState(0);
  const [university, setUniversity] = useState(universities[0].university);
  const [course, setCourse] = useState(universities[0].course);
  const [background, setBackground] = useState("a strong academic base in computing and an active interest in collaborative projects, problem solving, and practical software outcomes");
  const [goals, setGoals] = useState("build a software career in Australia that combines technical depth with long-term migration stability");

  const preview = useMemo(() => {
    const intro = sopTemplate.intro.replace("{course}", course).replace("{university}", university);
    const bg = sopTemplate.background.replace("{background}", background || "a focused academic foundation");
    const career = sopTemplate.goals.replace("{goals}", goals || "build a meaningful long-term career");
    return [intro, bg, career].join("\n\n");
  }, [background, course, goals, university]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top", "left", "right"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 20 }}>
        <SectionHeader
          eyebrow="Statement builder"
          title="Shape the SOP as you think."
          subtitle="Each step updates the draft in real time, so the final version feels intentional rather than generated."
        />

        {/* Step indicators */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {steps.map((label, index) => (
            <View
              key={label}
              style={{
                flex: 1,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: index <= step ? colors.navy : "rgba(26,47,110,0.08)"
              }}
            >
              <Text
                style={[
                  typography.bodySemiBold,
                  typography.eyebrow,
                  {
                    textAlign: "center",
                    fontSize: 12,
                    textTransform: "uppercase",
                    color: index <= step ? "#fff7e5" : colors.navy,
                    letterSpacing: 1.2
                  }
                ]}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Form card */}
        <EditorialCard>
          <View style={{ gap: 20, paddingHorizontal: 20, paddingVertical: 20 }}>
            {step === 0 ? (
              <>
                <FormField label="Target university" value={university} onChangeText={setUniversity} />
                <FormField label="Target course" value={course} onChangeText={setCourse} />
              </>
            ) : null}

            {step === 1 ? (
              <FormField
                label="Background"
                value={background}
                onChangeText={setBackground}
                multiline
                hint="Describe academics, work, projects, or the turning point that made this course make sense."
              />
            ) : null}

            {step === 2 ? (
              <FormField
                label="Career goals"
                value={goals}
                onChangeText={setGoals}
                multiline
                hint="Write your short and long-term goals. UniMate will turn this into the closing arc."
              />
            ) : null}

            {step === 3 ? (
              <View style={{ gap: 16 }}>
                <Text
                  style={[
                    typography.bodySemiBold,
                    typography.eyebrow,
                    { fontSize: 12, textTransform: "uppercase", color: colors.gold }
                  ]}
                >
                  Generated draft
                </Text>
                <Text style={[typography.body, { fontSize: 16, lineHeight: 32, color: "rgba(26,26,26,0.85)" }]}>
                  {preview}
                </Text>
              </View>
            ) : null}

            {/* Nav buttons */}
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setStep((current) => Math.max(0, current - 1));
                }}
                style={({ pressed }) => ({
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.line,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  opacity: pressed ? 0.7 : 1
                })}
              >
                <Text style={[typography.bodySemiBold, { color: colors.navy }]}>Back</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (step === 3) {
                    haptics.success();
                  } else {
                    haptics.selection();
                  }
                  setStep((current) => Math.min(3, current + 1));
                }}
                style={({ pressed }) => ({
                  borderRadius: 999,
                  backgroundColor: colors.gold,
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  opacity: pressed ? 0.86 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }]
                })}
              >
                <Text style={[typography.bodyBold, { color: colors.navy }]}>
                  {step === 3 ? "Refine" : "Next"}
                </Text>
              </Pressable>
            </View>
          </View>
        </EditorialCard>

        {/* Live preview */}
        <EditorialCard>
          <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
            <Text
              style={[
                typography.bodySemiBold,
                typography.eyebrow,
                { fontSize: 12, textTransform: "uppercase", color: colors.gold }
              ]}
            >
              Live preview
            </Text>
            <Text style={[typography.display, { marginTop: 16, fontSize: 30, lineHeight: 34, color: colors.charcoal }]}>
              Draft in progress
            </Text>
            <Text style={[typography.body, { marginTop: 16, fontSize: 16, lineHeight: 32, color: "rgba(26,26,26,0.85)" }]}>
              {preview}
            </Text>
          </View>
        </EditorialCard>
      </ScrollView>
    </SafeAreaView>
  );
}
