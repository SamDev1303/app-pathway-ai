import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EditorialCard } from "@/components/EditorialCard";
import { FormField } from "@/components/FormField";
import { SectionHeader } from "@/components/SectionHeader";
import { defaultProfile, ProfileData } from "@/lib/mockData";
import { colors, typography } from "@/lib/theme";

const STORAGE_KEY = "unimate-profile";
const steps = ["Personal", "Academic", "Intent", "Done"];

export default function ProfileScreen() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value) {
          setProfile(JSON.parse(value) as ProfileData);
        }
      })
      .catch(() => undefined);
  }, []);

  const saveProfile = async (nextProfile: ProfileData) => {
    setProfile(nextProfile);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
    } catch {
      return;
    }
  };

  const updateField = async (key: keyof ProfileData, value: string) => {
    const nextProfile = { ...profile, [key]: value };
    await saveProfile(nextProfile);
  };

  return (
    <SafeAreaView className="flex-1 bg-ivory">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, gap: 20 }}>
        <SectionHeader
          eyebrow="Onboarding"
          title="Build the profile once."
          subtitle="UniMate saves your study profile locally so the recommendation flow keeps its memory."
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
                <FormField label="Full name" value={profile.name} onChangeText={(value) => updateField("name", value)} />
                <FormField label="Country" value={profile.country} onChangeText={(value) => updateField("country", value)} />
              </>
            ) : null}

            {step === 1 ? (
              <>
                <FormField label="IELTS" value={profile.ielts} onChangeText={(value) => updateField("ielts", value)} />
                <FormField label="GPA" value={profile.gpa} onChangeText={(value) => updateField("gpa", value)} />
              </>
            ) : null}

            {step === 2 ? (
              <>
                <FormField label="Preferred field" value={profile.field} onChangeText={(value) => updateField("field", value)} />
                <FormField label="Budget" value={profile.budget} onChangeText={(value) => updateField("budget", value)} />
                <FormField label="PR intent" value={profile.prIntent} onChangeText={(value) => updateField("prIntent", value)} />
              </>
            ) : null}

            {step === 3 ? (
              <View className="gap-3">
                <Text className="text-xs uppercase text-gold" style={[typography.bodySemiBold, typography.eyebrow]}>
                  Profile saved
                </Text>
                <Text className="text-[30px] text-charcoal" style={[typography.display, { lineHeight: 34 }]}>
                  Ready for matching.
                </Text>
                {[
                  `Name: ${profile.name}`,
                  `Country: ${profile.country}`,
                  `IELTS: ${profile.ielts}`,
                  `GPA: ${profile.gpa}`,
                  `Field: ${profile.field}`,
                  `Budget: ${profile.budget}`,
                  `PR: ${profile.prIntent}`
                ].map((line) => (
                  <Text key={line} style={[typography.body, { color: colors.charcoal, lineHeight: 26 }]}>
                    {line}
                  </Text>
                ))}
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
                  {step === 3 ? "Done" : "Next"}
                </Text>
              </Pressable>
            </View>
          </View>
        </EditorialCard>
      </ScrollView>
    </SafeAreaView>
  );
}
