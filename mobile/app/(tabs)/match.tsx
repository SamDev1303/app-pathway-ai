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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={["top", "left", "right"]}>
      <FlatList
        data={universities}
        keyExtractor={(item) => item.id}
        pagingEnabled
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={() => haptics.light()}
        contentContainerStyle={{ paddingBottom: 86 }}
        renderItem={({ item }) => (
          <View style={{ height: height - 100, paddingHorizontal: 16, paddingBottom: 16 }}>
            <ImageBackground
              source={{ uri: item.image }}
              style={{ flex: 1, justifyContent: "space-between", overflow: "hidden", borderRadius: 34 }}
              contentFit="cover"
              transition={300}
            >
              <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                <View
                  style={{
                    alignSelf: "flex-start",
                    borderRadius: 999,
                    backgroundColor: "rgba(250,248,243,0.90)",
                    paddingHorizontal: 16,
                    paddingVertical: 8
                  }}
                >
                  <Text
                    style={[
                      typography.bodySemiBold,
                      typography.eyebrow,
                      { fontSize: 12, textTransform: "uppercase", color: colors.gold }
                    ]}
                  >
                    UniMatch deck
                  </Text>
                </View>
              </View>

              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 16,
                  borderRadius: 30,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                  backgroundColor: "rgba(11,23,60,0.92)",
                  padding: 20
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <View style={{ maxWidth: "73%" }}>
                    <Text style={[typography.display, { fontSize: 32, lineHeight: 36, color: "#ffffff" }]}>
                      {item.university}
                    </Text>
                    <Text style={[typography.bodyMedium, { marginTop: 8, fontSize: 16, color: "#f3d37d" }]}>
                      {item.course}
                    </Text>
                    <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <MapPin color="#fff7e7" size={16} />
                      <Text style={[typography.body, { fontSize: 14, color: "#f3e4c3" }]}>
                        {item.location}
                      </Text>
                    </View>
                  </View>
                  <ScoreRing score={item.score} />
                </View>

                {/* Info pills */}
                <View style={{ marginTop: 20, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {[
                    { icon: Wallet, value: item.budget },
                    { icon: Languages, value: item.ielts },
                    { icon: CalendarClock, value: item.duration }
                  ].map(({ icon: Icon, value }) => (
                    <View
                      key={value}
                      style={{
                        minWidth: "31%",
                        flex: 1,
                        borderRadius: 20,
                        backgroundColor: "rgba(255,255,255,0.14)",
                        paddingHorizontal: 16,
                        paddingVertical: 12
                      }}
                    >
                      <Icon color="#f3d37d" size={16} />
                      <Text style={[typography.body, { marginTop: 8, fontSize: 14, color: "#ffffff" }]}>
                        {value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Reason tags */}
                <View style={{ marginTop: 20, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {item.reasons.map((reason) => (
                    <View
                      key={reason}
                      style={{
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: "rgba(243,211,125,0.40)",
                        backgroundColor: "rgba(250,248,243,0.10)",
                        paddingHorizontal: 12,
                        paddingVertical: 8
                      }}
                    >
                      <Text
                        style={[
                          typography.bodySemiBold,
                          typography.eyebrow,
                          { fontSize: 12, textTransform: "uppercase", color: "#f7dfa1", letterSpacing: 1.4 }
                        ]}
                      >
                        {reason}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={[typography.body, { marginTop: 20, fontSize: 14, lineHeight: 28, color: "#f5ecd4" }]}>
                  {item.summary}
                </Text>

                {/* Intake + Apply */}
                <View style={{ marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View>
                    <Text
                      style={[
                        typography.bodySemiBold,
                        typography.eyebrow,
                        { fontSize: 12, textTransform: "uppercase", color: "rgba(255,255,255,0.55)", letterSpacing: 1.4 }
                      ]}
                    >
                      Intake
                    </Text>
                    <Text style={[typography.bodyMedium, { marginTop: 4, fontSize: 14, color: "#ffffff" }]}>
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
