import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EditorialCard } from "@/components/EditorialCard";
import { FormField } from "@/components/FormField";
import { SectionHeader } from "@/components/SectionHeader";
import { sopTemplate, universities } from "@/lib/mockData";
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
    <SafeAreaView className="flex-1 bg-cream">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, gap: 20 }}>
        <SectionHeader
          eyebrow="Statement builder"
          title="Shape the SOP as you think."
          subtitle="Each step updates the draft in real time, so the final version feels intentional rather than generated."
        />

        <View className="flex-row gap-2">
          {steps.map((label, index) => (
            <View
              key={label}
              className="flex-1 rounded-full px-3 py-2"
              style={{ backgroundColor: index <= step ? colors.navy : "rgba(26,47,110,0.08)" }}
            >
              <Text
                className="text-center text-xs uppercase"
                style={[
                  typography.bodySemiBold,
                  typography.eyebrow,
                  { color: index <= step ? "#fff7e5" : colors.navy, letterSpacing: 1.2 }
                ]}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        <EditorialCard>
          <View className="gap-5 px-5 py-5">
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
              <View className="gap-4">
                <Text className="text-xs uppercase text-gold" style={[typography.bodySemiBold, typography.eyebrow]}>
                  Generated draft
                </Text>
                <Text className="text-base leading-8 text-charcoal/85" style={typography.body}>
                  {preview}
                </Text>
              </View>
            ) : null}

            <View className="flex-row justify-between">
              <Pressable
                onPress={() => setStep((current) => Math.max(0, current - 1))}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.line,
                  paddingHorizontal: 18,
                  paddingVertical: 14
                }}
              >
                <Text style={[typography.bodySemiBold, { color: colors.navy }]}>Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setStep((current) => Math.min(3, current + 1))}
                style={{
                  borderRadius: 999,
                  backgroundColor: colors.gold,
                  paddingHorizontal: 20,
                  paddingVertical: 14
                }}
              >
                <Text style={[typography.bodyBold, { color: colors.navy }]}>
                  {step === 3 ? "Refine" : "Next"}
                </Text>
              </Pressable>
            </View>
          </View>
        </EditorialCard>

        <EditorialCard>
          <View className="px-5 py-5">
            <Text className="text-xs uppercase text-gold" style={[typography.bodySemiBold, typography.eyebrow]}>
              Live preview
            </Text>
            <Text className="mt-4 text-[30px] text-charcoal" style={[typography.display, { lineHeight: 34 }]}>
              Draft in progress
            </Text>
            <Text className="mt-4 text-base leading-8 text-charcoal/85" style={typography.body}>
              {preview}
            </Text>
          </View>
        </EditorialCard>
      </ScrollView>
    </SafeAreaView>
  );
}
