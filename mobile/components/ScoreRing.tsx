import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { colors, typography } from "@/lib/theme";

const RING_WIDTH = 6;
const TRACK_OPACITY = 0.12;

type Ring = {
  radius: number;
  stroke: string;
  pct: number;
};

export function ScoreRing({ score, size = 86 }: { score: number; size?: number }) {
  const center = size / 2;
  const clamped = Math.max(0, Math.min(100, score));

  const rings: Ring[] = [
    { radius: center - RING_WIDTH / 2 - 2, stroke: "url(#goldGrad)", pct: clamped / 100 },
    { radius: center - RING_WIDTH * 1.5 - 6, stroke: colors.navy, pct: clamped / 100 },
    { radius: center - RING_WIDTH * 2.5 - 10, stroke: "#e7c47a", pct: (clamped - 5) / 100 }
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
        {rings.map((ring, index) => {
          const circumference = 2 * Math.PI * ring.radius;
          const offset = circumference * (1 - Math.max(0, Math.min(1, ring.pct)));
          return (
            <React.Fragment key={index}>
              <Circle
                cx={center}
                cy={center}
                r={ring.radius}
                stroke={ring.stroke}
                strokeOpacity={TRACK_OPACITY}
                strokeWidth={RING_WIDTH}
                fill="none"
              />
              <Circle
                cx={center}
                cy={center}
                r={ring.radius}
                stroke={ring.stroke}
                strokeWidth={RING_WIDTH}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${center} ${center})`}
              />
            </React.Fragment>
          );
        })}
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
