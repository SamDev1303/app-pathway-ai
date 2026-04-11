import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { advisorPrompts } from "@/lib/mockData";
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
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.65);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 900 }), withTiming(0.55, { duration: 900 })),
      -1,
      true
    );

    return () => {
      timeouts.current.forEach(clearTimeout);
    };
  }, [glow, pulse]);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: glow.value
  }));

  const canPrompt = useMemo(() => !streamingId, [streamingId]);

  const handlePrompt = (label: string, response: string) => {
    if (!canPrompt) {
      return;
    }

    const userId = `user-${Date.now()}`;
    const assistantId = `assistant-${Date.now()}`;

    setMessages((current) => [...current, { id: userId, role: "user", text: label }, { id: assistantId, role: "assistant", text: "" }]);
    setStreamingId(assistantId);

    response.split("").forEach((char, index) => {
      const timeout = setTimeout(() => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, text: `${message.text}${char}` } : message
          )
        );

        if (index === response.length - 1) {
          setStreamingId(null);
        }
      }, index * 16);

      timeouts.current.push(timeout as unknown as number);
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-ivory">
      <LinearGradient colors={["#f6e8bf", "#d8b360", "#1a2f6e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View className="px-5 pb-7 pt-3">
          <View className="flex-row items-center gap-4">
            <Animated.View
              style={[
                avatarStyle,
                {
                  width: 62,
                  height: 62,
                  borderRadius: 31,
                  backgroundColor: "rgba(255,248,230,0.18)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.35)"
                }
              ]}
            >
              <Text style={[typography.display, { color: "#fff8e4", fontSize: 28 }]}>✦</Text>
            </Animated.View>
            <View className="flex-1">
              <Text className="text-xs uppercase text-[#fff1c5]" style={[typography.bodySemiBold, typography.eyebrow]}>
                AI advisor
              </Text>
              <Text className="mt-2 text-[34px] text-white" style={[typography.display, { lineHeight: 36 }]}>
                UniMate Counsel
              </Text>
              <Text className="mt-2 text-sm leading-6 text-white/80" style={typography.body}>
                Ask short, practical migration-study questions and watch the answer compose live.
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingVertical: 20, gap: 14 }}>
        <View className="flex-row flex-wrap gap-3">
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
              className={`max-w-[88%] rounded-[26px] px-5 py-4 ${assistant ? "self-start bg-white" : "self-end bg-[#1a2f6e]"}`}
              style={{
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

      <View className="border-t border-[#d9deec] bg-[#fffdf9] px-5 py-4">
        <Text className="text-center text-sm text-[#445891]" style={typography.body}>
          Not legal advice — book a free consultation.
        </Text>
      </View>
    </SafeAreaView>
  );
}
