import { FlatList, Pressable, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageBackground } from "expo-image";
import { MapPin, Wallet, Languages, CalendarClock } from "lucide-react-native";
import { ScoreRing } from "@/components/ScoreRing";
import { haptics } from "@/lib/haptics";
import { universities } from "@/lib/mockData";
import { colors, typography } from "@/lib/theme";

export default function MatchScreen() {
  const { height } = useWindowDimensions();

  return (
    <SafeAreaView className="flex-1 bg-[#eceff7]" edges={["top", "left", "right"]}>
      <FlatList
        data={universities}
        keyExtractor={(item) => item.id}
        pagingEnabled
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={() => haptics.light()}
        contentContainerStyle={{ paddingBottom: 86 }}
        renderItem={({ item }) => (
          <View style={{ height: height - 100 }} className="px-4 pb-4">
            <ImageBackground
              source={{ uri: item.image }}
              style={{ flex: 1, justifyContent: "space-between", overflow: "hidden", borderRadius: 34 }}
              contentFit="cover"
              transition={300}
            >
              <View className="px-5 pt-5">
                <View className="self-start rounded-full bg-[#faf8f3]/90 px-4 py-2">
                  <Text className="text-xs uppercase text-gold" style={[typography.bodySemiBold, typography.eyebrow]}>
                    UniMatch deck
                  </Text>
                </View>
              </View>

              <View className="mx-4 mb-4 rounded-[30px] border border-white/15 bg-[#13275f]/82 p-5">
                <View className="flex-row items-start justify-between">
                  <View className="max-w-[73%]">
                    <Text className="text-[38px] text-white" style={[typography.display, { lineHeight: 42 }]}>
                      {item.university}
                    </Text>
                    <Text className="mt-2 text-base text-[#f3d37d]" style={typography.bodyMedium}>
                      {item.course}
                    </Text>
                    <View className="mt-3 flex-row items-center gap-2">
                      <MapPin color="#fff7e7" size={16} />
                      <Text className="text-sm text-white/80" style={typography.body}>
                        {item.location}
                      </Text>
                    </View>
                  </View>
                  <ScoreRing score={item.score} />
                </View>

                <View className="mt-5 flex-row flex-wrap gap-3">
                  {[
                    { icon: Wallet, value: item.budget },
                    { icon: Languages, value: item.ielts },
                    { icon: CalendarClock, value: item.duration }
                  ].map(({ icon: Icon, value }) => (
                    <View
                      key={value}
                      className="min-w-[31%] flex-1 rounded-[20px] bg-white/10 px-4 py-3"
                    >
                      <Icon color="#f3d37d" size={16} />
                      <Text className="mt-2 text-sm text-white/85" style={typography.body}>
                        {value}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="mt-5 flex-row flex-wrap gap-2">
                  {item.reasons.map((reason) => (
                    <View key={reason} className="rounded-full border border-[#f3d37d]/40 bg-[#faf8f3]/10 px-3 py-2">
                      <Text className="text-xs uppercase text-[#f7dfa1]" style={[typography.bodySemiBold, typography.eyebrow, { letterSpacing: 1.4 }]}>
                        {reason}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text className="mt-5 text-sm leading-7 text-white/82" style={typography.body}>
                  {item.summary}
                </Text>

                <View className="mt-5 flex-row items-center justify-between">
                  <View>
                    <Text className="text-xs uppercase text-white/55" style={[typography.bodySemiBold, typography.eyebrow, { letterSpacing: 1.4 }]}>
                      Intake
                    </Text>
                    <Text className="mt-1 text-sm text-white" style={typography.bodyMedium}>
                      {item.intake}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => haptics.medium()}
                    android_ripple={{ color: "rgba(255,255,255,0.15)" }}
                    style={({ pressed }) => ({
                      backgroundColor: colors.gold,
                      paddingHorizontal: 22,
                      paddingVertical: 14,
                      borderRadius: 999,
                      opacity: pressed ? 0.86 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }]
                    })}
                  >
                    <Text style={[typography.bodyBold, { color: colors.navy }]}>Apply</Text>
                  </Pressable>
                </View>
              </View>
            </ImageBackground>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
