export const colors = {
  navy: "#1a2f6e",
  navyDeep: "#0f1f55",
  gold: "#c8941a",
  goldDeep: "#a07314",
  ivory: "#f6f7fb",
  cream: "#faf8f3",
  charcoal: "#1a1a1a",
  // Solid text tokens — use these instead of rgba(26,26,26,0.XX) which blended into cream/ivory bgs.
  textPrimary: "#111318",    // body copy on light bgs (near-black, high contrast)
  textSecondary: "#2b2f3a",  // secondary copy — still very readable
  textMuted: "#4a5068",      // supporting info
  textOnImage: "#ffffff",    // text on photo overlays
  textSoftOnDark: "#f1e7cf", // warm off-white on navy
  navyMuted: "rgba(26,47,110,0.4)",
  line: "rgba(26,47,110,0.10)",
  lineStrong: "rgba(26,47,110,0.22)",
  white: "#ffffff"
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40
};

export const radius = {
  sm: 14,
  md: 20,
  lg: 28,
  pill: 999
};

export const typography = {
  eyebrow: {
    letterSpacing: 2.4
  },
  display: {
    fontFamily: "InstrumentSerif_400Regular"
  },
  body: {
    fontFamily: "PlusJakartaSans_400Regular"
  },
  bodyMedium: {
    fontFamily: "PlusJakartaSans_500Medium"
  },
  bodySemiBold: {
    fontFamily: "PlusJakartaSans_600SemiBold"
  },
  bodyBold: {
    fontFamily: "PlusJakartaSans_700Bold"
  }
};

export const shadow = {
  card: {
    shadowColor: "#1a2f6e",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 6
  }
};
