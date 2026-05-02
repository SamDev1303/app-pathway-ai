import { useEffect, useMemo, useRef, useState } from "react";
import {
 ActivityIndicator,
 Animated,
 Easing,
 KeyboardAvoidingView,
 Platform,
 Pressable,
 ScrollView,
 Text,
 TextInput,
 View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { advisorPrompts } from "@/lib/mockData";
import { haptics } from "@/lib/haptics";
import { colors, typography } from "@/lib/theme";
import { askAdvisor } from "@/lib/api";

type Message = {
 id: string;
 role: "assistant" | "user";
 text: string;
};

const initialMessages: Message[] = [
 {
 id: "intro-assistant",
 role: "assistant",
 text: "Tell me your score, budget, or dream university. I will translate that into a cleaner Australia study strategy.",
 },
];

export default function ChatScreen() {
 const [messages, setMessages] = useState<Message[]>(initialMessages);
 const [streamingId, setStreamingId] = useState<string | null>(null);
 const [input, setInput] = useState("");
 const [waiting, setWaiting] = useState(false);
 const timeouts = useRef<number[]>([]);
 const scrollRef = useRef<ScrollView>(null);
 const pulse = useRef(new Animated.Value(1)).current;
 const glow = useRef(new Animated.Value(0.65)).current;

 useEffect(() => {
 const pulseAnim = Animated.loop(
 Animated.sequence([
 Animated.timing(pulse, { toValue: 1.05, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
 Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
 ]),
 );
 const glowAnim = Animated.loop(
 Animated.sequence([
 Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: true }),
 Animated.timing(glow, { toValue: 0.55, duration: 900, useNativeDriver: true }),
 ]),
 );
 pulseAnim.start();
 glowAnim.start();

 return () => {
 pulseAnim.stop();
 glowAnim.stop();
 timeouts.current.forEach(clearTimeout);
 };
 }, [glow, pulse]);

 const busy = waiting || streamingId !== null;
 const canSend = useMemo(() => !busy && input.trim().length > 2, [busy, input]);

 // Animate the real AI response character-by-character into the last assistant bubble.
 // Keeps the existing "typing in" feel without building full SSE streaming on mobile.
 const animateResponse = (assistantId: string, response: string) => {
 const ids: number[] = [];
 // Faster on longer responses so user isn't waiting forever.
 const perChar = response.length > 400 ? 8 : 14;
 response.split("").forEach((char, index) => {
 const t = setTimeout(() => {
 setMessages((current) =>
 current.map((m) => (m.id === assistantId ? { ...m, text: `${m.text}${char}` } : m)),
 );
 if (index === response.length - 1) {
 setStreamingId(null);
 haptics.light();
 scrollRef.current?.scrollToEnd({ animated: true });
 }
 }, index * perChar);
 ids.push(t as unknown as number);
 });
 timeouts.current = ids;
 };

 const ask = async (question: string) => {
 if (busy) return;
 haptics.selection();
 const userId = `user-${Date.now()}`;
 const assistantId = `assistant-${Date.now()}`;
 setMessages((current) => [
 ...current,
 { id: userId, role: "user", text: question },
 { id: assistantId, role: "assistant", text: "" },
 ]);
 setWaiting(true);
 scrollRef.current?.scrollToEnd({ animated: true });

 try {
 const response = await askAdvisor(question);
 setWaiting(false);
 setStreamingId(assistantId);
 animateResponse(assistantId, response || "I couldn't reach a clear answer just now. Try a -specific question or book a free consultation at our office.");
 } catch (err) {
 setWaiting(false);
 setStreamingId(null);
 const fallback =
 "Our AI advisor is briefly unavailable. Please book a free consultation at our office on +61 2 8000 1234 — we'll answer within the hour.";
 setMessages((current) =>
 current.map((m) => (m.id === assistantId ? { ...m, text: fallback } : m)),
 );
 haptics.error();
 }
 };

 const handleSend = () => {
 const q = input.trim();
 if (!q) return;
 setInput("");
 ask(q);
 };

 return (
 <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={["top", "left", "right"]}>
 <KeyboardAvoidingView
 style={{ flex: 1 }}
 behavior={Platform.OS === "ios" ? "padding" : undefined}
 keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
 >
 <LinearGradient colors={["#f6e8bf", "#d8b360", "#1a2f6e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
 <View style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12 }}>
 <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
 <Animated.View
 style={{
 transform: [{ scale: pulse }],
 opacity: glow,
 width: 62,
 height: 62,
 borderRadius: 31,
 backgroundColor: "rgba(255,248,230,0.20)",
 alignItems: "center",
 justifyContent: "center",
 borderWidth: 1,
 borderColor: "rgba(255,255,255,0.40)",
 }}
 >
 <Text style={[typography.display, { color: "#fff8e4", fontSize: 28 }]}>✦</Text>
 </Animated.View>
 <View style={{ flex: 1 }}>
 <Text
 style={[
 typography.bodySemiBold,
 typography.eyebrow,
 { fontSize: 12, textTransform: "uppercase", color: "#fff1c5" },
 ]}
 >
 AI advisor · live
 </Text>
 <Text style={[typography.display, { marginTop: 8, fontSize: 32, lineHeight: 36, color: "#ffffff" }]}>
 Pathway-AI Counsel
 </Text>
 <Text style={[typography.body, { marginTop: 8, fontSize: 14, lineHeight: 22, color: "rgba(255,255,255,0.92)" }]}>
 Ask about Australian universities, courses, IELTS, and study pathways.
 </Text>
 </View>
 </View>
 </View>
 </LinearGradient>

 <ScrollView
 ref={scrollRef}
 style={{ flex: 1, paddingHorizontal: 20 }}
 contentContainerStyle={{ paddingVertical: 20, paddingBottom: 20, gap: 14 }}
 keyboardShouldPersistTaps="handled"
 >
 <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
 {advisorPrompts.map((prompt) => (
 <Pressable
 key={prompt.id}
 disabled={busy}
 onPress={() => ask(prompt.label)}
 style={{
 borderRadius: 999,
 borderWidth: 1,
 borderColor: "rgba(26,47,110,0.18)",
 backgroundColor: busy ? "rgba(255,255,255,0.6)" : "#fffdf8",
 paddingHorizontal: 16,
 paddingVertical: 12,
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
 maxWidth: "90%",
 borderRadius: 26,
 paddingHorizontal: 20,
 paddingVertical: 16,
 alignSelf: assistant ? "flex-start" : "flex-end",
 backgroundColor: assistant ? "#ffffff" : "#1a2f6e",
 borderWidth: 1,
 borderColor: assistant ? "rgba(26,47,110,0.10)" : "transparent",
 }}
 >
 <Text
 style={[
 assistant ? typography.body : typography.bodyMedium,
 {
 color: assistant ? "#1a1a1a" : "#fff8e5",
 lineHeight: 24,
 fontSize: 15,
 },
 ]}
 >
 {message.text || (waiting && message.id === messages[messages.length - 1]?.id ? "Thinking…" : "…")}
 </Text>
 </View>
 );
 })}

 {waiting ? (
 <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 4 }}>
 <ActivityIndicator size="small" color={colors.navy} />
 <Text style={[typography.body, { fontSize: 13, color: "#445891" }]}>Advisor is thinking…</Text>
 </View>
 ) : null}
 </ScrollView>

 <View
 style={{
 borderTopWidth: 1,
 borderTopColor: "#e5ddc8",
 backgroundColor: "#fffdf9",
 paddingHorizontal: 16,
 paddingTop: 12,
 paddingBottom: 12,
 gap: 8,
 }}
 >
 <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
 <TextInput
 value={input}
 onChangeText={setInput}
 placeholder="Ask about courses, IELTS, Group of Eight…"
 placeholderTextColor="#8892b4"
 style={{
 flex: 1,
 borderRadius: 22,
 borderWidth: 1,
 borderColor: "#d9deec",
 backgroundColor: "#ffffff",
 paddingHorizontal: 18,
 paddingVertical: 12,
 fontSize: 15,
 color: "#1a1a1a",
 }}
 returnKeyType="send"
 onSubmitEditing={handleSend}
 editable={!busy}
 />
 <Pressable
 onPress={handleSend}
 disabled={!canSend}
 style={({ pressed }) => ({
 backgroundColor: canSend ? colors.navy : "#b2b8cc",
 paddingHorizontal: 20,
 paddingVertical: 12,
 borderRadius: 22,
 opacity: pressed ? 0.85 : 1,
 })}
 >
 <Text style={[typography.bodyBold, { color: "#fff8e5", fontSize: 14 }]}>Ask</Text>
 </Pressable>
 </View>
 <Text style={[typography.body, { textAlign: "center", fontSize: 12, color: "#667199" }]}>
 Not legal advice — book a free consultation at our office.
 </Text>
 </View>
 </KeyboardAvoidingView>
 </SafeAreaView>
 );
}
