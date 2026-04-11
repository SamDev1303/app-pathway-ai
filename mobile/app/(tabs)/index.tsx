import { Image, ImageBackground, ScrollView, Text, View } from "react-native";
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
    <SafeAreaView className="flex-1 bg-ivory">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-10">
          <View className="mt-2 overflow-hidden rounded-[30px] border border-[#e5ddc8]">
            <ImageBackground
              source={{ uri: topMatch.image }}
              className="h-[360px] justify-between"
              imageStyle={{ borderRadius: 30 }}
            >
              <View className="bg-[#1a2f6e]/45 px-6 pb-6 pt-5">
                <Text className="text-xs uppercase text-[#f8d585]" style={[typography.bodySemiBold, typography.eyebrow]}>
                  UniMate Australia
                </Text>
                <Text className="mt-4 max-w-[82%] text-[48px] text-white" style={[typography.display, { lineHeight: 52 }]}>
                  Study migration, treated like a life editorial.
                </Text>
              </View>

              <View className="m-5 rounded-[28px] border border-white/20 bg-[#faf8f3]/92 p-5">
                <Text className="text-xs uppercase text-gold" style={[typography.bodySemiBold, typography.eyebrow]}>
                  Today&apos;s Match
                </Text>
                <View className="mt-3 flex-row items-center justify-between">
                  <View className="max-w-[72%] gap-2">
                    <Text className="text-3xl text-charcoal" style={typography.display}>
                      {topMatch.university}
                    </Text>
                    <Text className="text-base text-[#30498f]" style={typography.bodyMedium}>
                      {topMatch.course}
                    </Text>
                    <Text className="text-sm leading-6 text-charcoal/80" style={typography.body}>
                      {topMatch.summary}
                    </Text>
                  </View>
                  <ScoreRing score={topMatch.score} />
                </View>
              </View>
            </ImageBackground>
          </View>

          <View className="mt-8">
            <SectionHeader
              eyebrow="Curated for today"
              title="A warmer way to compare options."
              subtitle="Not a grid of widgets. A quiet feed of the decisions, signals, and next steps that matter most."
            />
          </View>

          <View className="mt-6 gap-5">
            <EditorialCard>
              <View className="flex-row items-center justify-between bg-cream px-5 py-4">
                <View className="max-w-[80%]">
                  <Text className="text-xs uppercase text-gold" style={[typography.bodySemiBold, typography.eyebrow]}>
                    AI advisor tip of the day
                  </Text>
                  <Text className="mt-2 text-2xl text-charcoal" style={typography.display}>
                    Build a smarter shortlist.
                  </Text>
                </View>
                <Sparkles color={colors.gold} size={22} strokeWidth={2} />
              </View>
              <View className="px-5 py-5">
                <Text className="text-base leading-8 text-charcoal/85" style={typography.body}>
                  {advisorTip}
                </Text>
              </View>
            </EditorialCard>

            <EditorialCard>
              <View className="flex-row">
                <Image
                  source={{ uri: universities[4].image }}
                  className="h-[180px] w-[34%]"
                  resizeMode="cover"
                />
                <View className="flex-1 px-5 py-5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs uppercase text-gold" style={[typography.bodySemiBold, typography.eyebrow]}>
                      Visa update
                    </Text>
                    <CircleAlert color={colors.navy} size={18} />
                  </View>
                  <Text className="mt-3 text-[30px] text-charcoal" style={[typography.display, { lineHeight: 34 }]}>
                    Clearer story, stronger file.
                  </Text>
                  <Text className="mt-3 text-sm leading-7 text-charcoal/80" style={typography.body}>
                    {visaUpdate.body}
                  </Text>
                  <View className="mt-4 flex-row items-center gap-2">
                    <Text className="text-sm text-[#30498f]" style={typography.bodySemiBold}>
                      Read how UniMate frames this
                    </Text>
                    <ArrowUpRight color={colors.gold} size={16} />
                  </View>
                </View>
              </View>
            </EditorialCard>

            <EditorialCard>
              <View className="px-5 py-5">
                <Text className="text-xs uppercase text-gold" style={[typography.bodySemiBold, typography.eyebrow]}>
                  Why this app
                </Text>
                <Text className="mt-3 text-[30px] text-charcoal" style={[typography.display, { lineHeight: 34 }]}>
                  Prestige, budget, English, migration fit.
                </Text>
                <Text className="mt-3 text-base leading-8 text-charcoal/80" style={typography.body}>
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
