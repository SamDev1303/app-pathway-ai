import { useEffect } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  Easing
} from "react-native-reanimated";
import { colors, typography } from "@/lib/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_WIDTH = 6;
const TRACK_OPACITY = 0.12;

type Ring = {
  radius: number;
  stroke: string;
  delay: number;
  pct: number;
};

export function ScoreRing({ score, size = 86 }: { score: number; size?: number }) {
  const center = size / 2;
  const clamped = Math.max(0, Math.min(100, score));

  const rings: Ring[] = [
    { radius: center - RING_WIDTH / 2 - 2, stroke: "url(#goldGrad)", delay: 0, pct: clamped / 100 },
    { radius: center - RING_WIDTH * 1.5 - 6, stroke: colors.navy, delay: 120, pct: clamped / 100 },
    { radius: center - RING_WIDTH * 2.5 - 10, stroke: "#e7c47a", delay: 240, pct: (clamped - 5) / 100 }
  ];

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Defs>
          <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#f3d37d" />
            <Stop offset="100%" stopColor="#c8941a" />
          </LinearGradient>
        </Defs>
        {rings.map((ring, index) => (
          <RingArc
            key={index}
            center={center}
            radius={ring.radius}
            stroke={ring.stroke}
            delay={ring.delay}
            pct={ring.pct}
          />
        ))}
      </Svg>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text style={[typography.bodyBold, { color: colors.navy, fontSize: size * 0.3, lineHeight: size * 0.32 }]}>
          {Math.round(clamped)}
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.gold, fontSize: size * 0.13, marginTop: 2, letterSpacing: 1.4, textTransform: "uppercase" }]}>
          match
        </Text>
      </View>
    </View>
  );
}

function RingArc({
  center,
  radius,
  stroke,
  delay,
  pct
}: {
  center: number;
  radius: number;
  stroke: string;
  delay: number;
  pct: number;
}) {
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(circumference);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(circumference * (1 - Math.max(0, Math.min(1, pct))), {
        duration: 900,
        easing: Easing.out(Easing.cubic)
      })
    );
  }, [circumference, delay, pct, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: progress.value
  }));

  return (
    <>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={stroke}
        strokeOpacity={TRACK_OPACITY}
        strokeWidth={RING_WIDTH}
        fill="none"
      />
      <AnimatedCircle
        cx={center}
        cy={center}
        r={radius}
        stroke={stroke}
        strokeWidth={RING_WIDTH}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        animatedProps={animatedProps}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </>
  );
}
