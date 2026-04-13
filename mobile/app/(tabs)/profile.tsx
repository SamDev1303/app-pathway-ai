import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, Text, View } from "react-native";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EditorialCard } from "@/components/EditorialCard";
import { ScoreRing } from "@/components/ScoreRing";
import { auImages } from "@/lib/images";
import { haptics } from "@/lib/haptics";
import { universities } from "@/lib/mockData";
import { colors, typography } from "@/lib/theme";

const STORAGE_KEY = "unimate-onboarding-v2";

type Field = "it" | "engineering" | "business" | "health" | "education";
type Intake = "feb27" | "jul27" | "oct27";

type Onboarding = {
  field: Field | null;
  ielts: number;
  intake: Intake | null;
  completedAt: string | null;
};

const defaultOnboarding: Onboarding = {
  field: null,
  ielts: 6.5,
  intake: null,
  completedAt: null
};

const fieldOptions: {
  id: Field;
  title: string;
  blurb: string;
  image: string;
}[] = [
  {
    id: "it",
    title: "Information Technology",
    blurb: "Software, data, cyber, AI — the most PR-active pathway in 2026.",
    image: auImages.unsw
  },
  {
    id: "engineering",
    title: "Engineering",
    blurb: "Civil, mechanical, electrical — long-standing skilled migration occupations.",
    image: auImages.uqGreatCourt
  },
  {
    id: "business",
    title: "Business & Analytics",
    blurb: "MBA, data analytics, accounting — strong metro employer networks.",
    image: auImages.melbourneCbd
  },
  {
    id: "health",
    title: "Health & Nursing",
    blurb: "Nursing, allied health — fastest current PR pathway via MLTSSL.",
    image: auImages.bondi
  },
  {
    id: "education",
    title: "Education & Teaching",
    blurb: "Early childhood, secondary teaching — regional incentives apply.",
    image: auImages.anuLibrary
  }
];

const intakeOptions: {
  id: Intake;
  label: string;
  caption: string;
  image: string;
}[] = [
  {
    id: "feb27",
    label: "Feb 2027",
    caption: "Biggest intake. Most courses, most scholarships.",
    image: auImages.sydneyOpera
  },
  {
    id: "jul27",
    label: "July 2027",
    caption: "Strong second intake. Good for late deciders.",
    image: auImages.melbourneTram
  },
  {
    id: "oct27",
    label: "Oct 2027",
    caption: "Selective intake. Limited courses, faster pathway.",
    image: auImages.bondi
  }
];

function ieltsCaption(score: number): { tone: "low" | "ok" | "great"; line: string } {
  if (score < 6.0) {
    return { tone: "low", line: "Most AU undergrad programs need 6.0 minimum. Pathway courses are open to you." };
  }
  if (score < 6.5) {
    return { tone: "ok", line: "Undergrad ready. Postgrad and Group of Eight need 6.5 — consider a retake." };
  }
  if (score < 7.0) {
    return { tone: "ok", line: "Group of Eight unlocked. Most metro postgrad accept this score." };
  }
  if (score < 7.5) {
    return { tone: "great", line: "Nursing, teaching, and Group of Eight postgrad all open. Strong file." };
  }
  return { tone: "great", line: "Top-tier ready. Every Australian university and PR-eligible pathway is open." };
}

export default function ProfileScreen() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Onboarding>(defaultOnboarding);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<Onboarding>;
            // Shape-guard: merge with defaults so stale/partial payloads never crash later reads
            // (e.g. data.ielts.toFixed()). If critical fields are the wrong type, fall back cleanly.
            const safe: Onboarding = {
              ...defaultOnboarding,
              ...parsed,
              ielts: typeof parsed.ielts === "number" ? parsed.ielts : defaultOnboarding.ielts,
            };
            setData(safe);
            if (safe.completedAt) {
              setStep(3);
            }
          } catch {
            AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
          }
        }
      })
      .catch(() => undefined);
  }, []);

  const persist = async (next: Onboarding) => {
    setData(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      return;
    }
  };

  const selectField = async (field: Field) => {
    haptics.selection();
    await persist({ ...data, field });
  };

  const setIelts = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    haptics.selection();
    persist({ ...data, ielts: rounded });
  };

  const selectIntake = async (intake: Intake) => {
    haptics.selection();
    await persist({ ...data, intake });
  };

  const next = async () => {
    if (step === 0 && !data.field) return;
    if (step === 2) {
      if (!data.intake) return;
      haptics.success();
      await persist({ ...data, completedAt: new Date().toISOString() });
      setStep(3);
      return;
    }
    haptics.light();
    setStep((s) => Math.min(3, s + 1));
  };

  const back = () => {
    haptics.selection();
    setStep((s) => Math.max(0, s - 1));
  };

  const reset = async () => {
    haptics.warning();
    await persist(defaultOnboarding);
    setStep(0);
  };

  const stepImage =
    step === 0
      ? auImages.sydneyOpera
      : step === 1
        ? auImages.melbourneCbd
        : step === 2
          ? auImages.bondi
          : auImages.usydQuad;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* Hero banner */}
        <ImageBackground
          source={{ uri: stepImage }}
          style={{ height: 240 }}
          contentFit="cover"
          transition={500}
        >
          <LinearGradient
            colors={["rgba(26,47,110,0.10)", "rgba(26,47,110,0.78)"]}
            style={{ flex: 1, justifyContent: "flex-end", paddingHorizontal: 22, paddingVertical: 22 }}
          >
            <Text style={[typography.bodySemiBold, typography.eyebrow, { color: "#fff1c5", fontSize: 11, textTransform: "uppercase" }]}>
              {step === 3 ? "Profile saved" : `Step ${step + 1} of 3`}
            </Text>
            <Text style={[typography.display, { color: "#fff", fontSize: 34, lineHeight: 38, marginTop: 6 }]}>
              {step === 0 && "What do you want to study?"}
              {step === 1 && "What's your English level?"}
              {step === 2 && "When do you want to start?"}
              {step === 3 && `Welcome${data.field ? "," : ""} student.`}
            </Text>
          </LinearGradient>
        </ImageBackground>

        {/* Progress bar */}
        {step < 3 ? (
          <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 20 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: i <= step ? colors.gold : "rgba(26,47,110,0.12)"
                }}
              />
            ))}
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
          {/* Step 0: Field selection */}
          {step === 0 ? (
            <View style={{ gap: 16 }}>
              {fieldOptions.map((option) => {
                const selected = data.field === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => selectField(option.id)}
                    style={({ pressed }) => ({
                      borderRadius: 24,
                      overflow: "hidden",
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? colors.gold : "rgba(26,47,110,0.10)",
                      opacity: pressed ? 0.92 : 1,
                      transform: [{ scale: pressed ? 0.985 : 1 }]
                    })}
                  >
                    <ImageBackground
                      source={{ uri: option.image }}
                      style={{ height: 120, justifyContent: "flex-end" }}
                      contentFit="cover"
                      transition={300}
                    >
                      <LinearGradient
                        colors={["rgba(0,0,0,0)", "rgba(26,47,110,0.86)"]}
                        style={{ paddingHorizontal: 18, paddingVertical: 14 }}
                      >
                        <Text style={[typography.display, { color: "#fff", fontSize: 22, lineHeight: 24 }]}>
                          {option.title}
                        </Text>
                        <Text style={[typography.body, { color: "#f3e4c3", fontSize: 13, lineHeight: 18, marginTop: 4 }]}>
                          {option.blurb}
                        </Text>
                      </LinearGradient>
                    </ImageBackground>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* Step 1: IELTS slider */}
          {step === 1 ? (
            <View style={{ gap: 24 }}>
              <EditorialCard>
                <View style={{ paddingHorizontal: 24, paddingVertical: 28 }}>
                  <Text style={[typography.bodySemiBold, typography.eyebrow, { color: colors.gold, fontSize: 11, textTransform: "uppercase" }]}>
                    IELTS overall band
                  </Text>
                  <Text style={[typography.display, { color: colors.charcoal, fontSize: 64, lineHeight: 68, marginTop: 8 }]}>
                    {data.ielts.toFixed(1)}
                  </Text>
                  <SliderRow value={data.ielts} onChange={setIelts} />
                  <View style={{ marginTop: 20, borderRadius: 16, backgroundColor: colors.ivory, paddingHorizontal: 16, paddingVertical: 16 }}>
                    <Text style={[typography.bodyMedium, { color: colors.navy, fontSize: 14, lineHeight: 22 }]}>
                      {ieltsCaption(data.ielts).line}
                    </Text>
                  </View>
                </View>
              </EditorialCard>
              <Text style={[typography.body, { color: "rgba(26,47,110,0.6)", fontSize: 12, textAlign: "center", lineHeight: 18 }]}>
                Don't have a score yet? Pick your honest self-estimate. UniMate plans against reality, not optimism.
              </Text>
            </View>
          ) : null}

          {/* Step 2: Intake selection */}
          {step === 2 ? (
            <View style={{ gap: 16 }}>
              {intakeOptions.map((option) => {
                const selected = data.intake === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => selectIntake(option.id)}
                    style={({ pressed }) => ({
                      borderRadius: 24,
                      overflow: "hidden",
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? colors.gold : "rgba(26,47,110,0.10)",
                      opacity: pressed ? 0.92 : 1,
                      transform: [{ scale: pressed ? 0.985 : 1 }]
                    })}
                  >
                    <ImageBackground
                      source={{ uri: option.image }}
                      style={{ height: 130, justifyContent: "space-between", padding: 18 }}
                      contentFit="cover"
                      transition={300}
                    >
                      <View style={{ alignSelf: "flex-start", borderRadius: 999, backgroundColor: "rgba(250,248,243,0.92)", paddingHorizontal: 12, paddingVertical: 6 }}>
                        <Text style={[typography.bodySemiBold, typography.eyebrow, { color: colors.gold, fontSize: 10, textTransform: "uppercase" }]}>
                          Intake
                        </Text>
                      </View>
                      <LinearGradient
                        colors={["rgba(0,0,0,0)", "rgba(26,47,110,0.86)"]}
                        style={{ marginHorizontal: -18, marginBottom: -18, paddingHorizontal: 18, paddingVertical: 14 }}
                      >
                        <Text style={[typography.display, { color: "#fff", fontSize: 24, lineHeight: 26 }]}>
                          {option.label}
                        </Text>
                        <Text style={[typography.body, { color: "#f3e4c3", fontSize: 12, lineHeight: 18, marginTop: 4 }]}>
                          {option.caption}
                        </Text>
                      </LinearGradient>
                    </ImageBackground>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* Step 3: Completed profile */}
          {step === 3 ? (
            <View style={{ gap: 20 }}>
              <EditorialCard>
                <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>
                  <Text style={[typography.bodySemiBold, typography.eyebrow, { color: colors.gold, fontSize: 11, textTransform: "uppercase" }]}>
                    Your top match
                  </Text>
                  <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={[typography.display, { color: colors.charcoal, fontSize: 26, lineHeight: 30 }]}>
                        {universities[0].university}
                      </Text>
                      <Text style={[typography.bodyMedium, { color: colors.navy, fontSize: 14, marginTop: 4 }]}>
                        {universities[0].course}
                      </Text>
                      <Text style={[typography.body, { color: "#2b2f3a", fontSize: 13, lineHeight: 19, marginTop: 8 }]}>
                        {universities[0].summary}
                      </Text>
                    </View>
                    <ScoreRing score={universities[0].score} size={78} />
                  </View>
                </View>
              </EditorialCard>

              <EditorialCard>
                <View style={{ paddingHorizontal: 24, paddingVertical: 24, gap: 12 }}>
                  <Text style={[typography.bodySemiBold, typography.eyebrow, { color: colors.gold, fontSize: 11, textTransform: "uppercase" }]}>
                    Your profile
                  </Text>
                  <Row label="Field" value={fieldOptions.find((f) => f.id === data.field)?.title ?? "—"} />
                  <Row label="IELTS" value={data.ielts.toFixed(1)} />
                  <Row label="Intake" value={intakeOptions.find((i) => i.id === data.intake)?.label ?? "—"} />
                </View>
              </EditorialCard>

              <Pressable
                onPress={reset}
                style={({ pressed }) => ({
                  alignSelf: "center",
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  opacity: pressed ? 0.6 : 1
                })}
              >
                <Text style={[typography.bodyMedium, { color: colors.navy, fontSize: 13, textDecorationLine: "underline" }]}>
                  Reset onboarding
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom nav buttons */}
      {step < 3 ? (
        <View
          style={{
            position: "absolute",
            bottom: 96,
            left: 20,
            right: 20,
            flexDirection: "row",
            gap: 12
          }}
        >
          {step > 0 ? (
            <Pressable
              onPress={back}
              style={({ pressed }) => ({
                paddingHorizontal: 22,
                paddingVertical: 16,
                borderRadius: 999,
                backgroundColor: "rgba(255,253,249,0.96)",
                borderWidth: 1,
                borderColor: "rgba(26,47,110,0.14)",
                opacity: pressed ? 0.8 : 1
              })}
            >
              <Text style={[typography.bodySemiBold, { color: colors.navy }]}>Back</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={next}
            disabled={(step === 0 && !data.field) || (step === 2 && !data.intake)}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: "center",
              paddingVertical: 16,
              borderRadius: 999,
              backgroundColor:
                (step === 0 && !data.field) || (step === 2 && !data.intake)
                  ? "rgba(200,148,26,0.4)"
                  : colors.gold,
              opacity: pressed ? 0.86 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }]
            })}
          >
            <Text style={[typography.bodyBold, { color: colors.navy, fontSize: 15 }]}>
              {step === 2 ? "Finish" : "Continue"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={[typography.body, { color: "#4a5068", fontSize: 13 }]}>{label}</Text>
      <Text style={[typography.bodySemiBold, { color: colors.navy, fontSize: 14 }]}>{value}</Text>
    </View>
  );
}

function SliderRow({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const stops = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];
  const fillPct = useRef(new Animated.Value((value - 5.0) / 4.0)).current;

  useEffect(() => {
    Animated.timing(fillPct, { toValue: (value - 5.0) / 4.0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [fillPct, value]);

  const fillWidth = fillPct.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"], extrapolate: "clamp" });

  return (
    <View style={{ marginTop: 24 }}>
      <View style={{ height: 8, width: "100%", borderRadius: 999, backgroundColor: "#eceff7" }}>
        <Animated.View
          style={{ width: fillWidth, height: 8, borderRadius: 999, backgroundColor: colors.gold }}
        />
      </View>
      <View style={{ marginTop: 16, flexDirection: "row", justifyContent: "space-between" }}>
        {stops.map((stop) => {
          const active = Math.abs(stop - value) < 0.05;
          return (
            <Pressable
              key={stop}
              onPress={() => onChange(stop)}
              hitSlop={8}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? colors.navy : "transparent"
              }}
            >
              <Text
                style={[
                  typography.bodyMedium,
                  {
                    color: active ? "#fff7e5" : "rgba(26,47,110,0.55)",
                    fontSize: 11
                  }
                ]}
              >
                {stop.toFixed(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
