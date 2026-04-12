import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { advisorPrompts } from "@/lib/mockData";
import { haptics } from "@/lib/haptics";
import { colors, typography } from "@/lib/theme";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const initialMessages: Message[] = [
  {
    id: "intro-assistant",
    role: "assistant",
    text: "Tell me your score, budget, or dream university. I will translate that into a cleaner Australia study strategy."
  }
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const timeouts = useRef<number[]>([]);
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.65)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    );
    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.55, duration: 900, useNativeDriver: true })
      ])
    );
    pulseAnim.start();
    glowAnim.start();

    return () => {
      pulseAnim.stop();
      glowAnim.stop();
      timeouts.current.forEach(clearTimeout);
    };
  }, [glow, pulse]);

  const canPrompt = useMemo(() => !streamingId, [streamingId]);

  const handlePrompt = (label: string, response: string) => {
    if (!canPrompt) {
      return;
    }
    haptics.selection();

    const userId = `user-${Date.now()}`;
    const assistantId = `assistant-${Date.now()}`;

    setMessages((current) => [...current, { id: userId, role: "user", text: label }, { id: assistantId, role: "assistant", text: "" }]);
    setStreamingId(assistantId);

    const ids: number[] = [];
    response.split("").forEach((char, index) => {
      const timeout = setTimeout(() => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, text: `${message.text}${char}` } : message
          )
        );

        if (index === response.length - 1) {
          setStreamingId(null);
          haptics.light();
        }
      }, index * 16);

      ids.push(timeout as unknown as number);
    });
    timeouts.current = ids;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <LinearGradient colors={["#f6e8bf", "#d8b360", "#1a2f6e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Animated.View
              style={{
                transform: [{ scale: pulse }],
                opacity: glow,
                width: 62,
                height: 62,
                borderRadius: 31,
                backgroundColor: "rgba(255,248,230,0.18)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)"
              }}
            >
              <Text style={[typography.display, { color: "#fff8e4", fontSize: 28 }]}>✦</Text>
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  typography.bodySemiBold,
                  typography.eyebrow,
                  { fontSize: 12, textTransform: "uppercase", color: "#fff1c5" }
                ]}
              >
                AI advisor
              </Text>
              <Text style={[typography.display, { marginTop: 8, fontSize: 34, lineHeight: 36, color: "#ffffff" }]}>
                UniMate Counsel
              </Text>
              <Text style={[typography.body, { marginTop: 8, fontSize: 14, lineHeight: 24, color: "rgba(255,255,255,0.80)" }]}>
                Ask short, practical migration-study questions and watch the answer compose live.
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingVertical: 20, paddingBottom: 120, gap: 14 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {advisorPrompts.map((prompt) => (
            <Pressable
              key={prompt.id}
              disabled={!canPrompt}
              onPress={() => handlePrompt(prompt.label, prompt.response)}
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(26,47,110,0.12)",
                backgroundColor: canPrompt ? "#fffdf8" : "rgba(255,255,255,0.7)",
                paddingHorizontal: 16,
                paddingVertical: 12
              }}
            >
              <Text style={[typography.bodyMedium, { color: colors.navy, fontSize: 13 }]}>{prompt.label}</Text>
            </Pressable>
          ))}
        </View>

        {messages.map((message) => {
          const assistant = message.role === "assistant";
          return (
            <View
              key={message.id}
              style={{
                maxWidth: "88%",
                borderRadius: 26,
                paddingHorizontal: 20,
                paddingVertical: 16,
                alignSelf: assistant ? "flex-start" : "flex-end",
                backgroundColor: assistant ? "#ffffff" : "#1a2f6e",
                borderWidth: 1,
                borderColor: assistant ? "rgba(26,47,110,0.08)" : "transparent"
              }}
            >
              <Text
                style={[
                  assistant ? typography.body : typography.bodyMedium,
                  {
                    color: assistant ? colors.charcoal : "#fff8e5",
                    lineHeight: 24
                  }
                ]}
              >
                {message.text || "…"}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: "#d9deec",
          backgroundColor: "#fffdf9",
          paddingHorizontal: 20,
          paddingVertical: 16
        }}
      >
        <Text style={[typography.body, { textAlign: "center", fontSize: 14, color: "#445891" }]}>
          Not legal advice — book a free consultation.
        </Text>
      </View>
    </SafeAreaView>
  );
}
