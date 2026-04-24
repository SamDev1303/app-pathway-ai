import "@/global.css";

import { initSentry, Sentry } from "@/lib/sentry";
initSentry();

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts as useInstrumentSerif,
  InstrumentSerif_400Regular
} from "@expo-google-fonts/instrument-serif";
import {
  useFonts as usePlusJakartaSans,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold
} from "@expo-google-fonts/plus-jakarta-sans";
import { colors } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootLayout() {
  const [serifLoaded] = useInstrumentSerif({
    InstrumentSerif_400Regular
  });
  const [sansLoaded] = usePlusJakartaSans({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold
  });

  useEffect(() => {
    if (serifLoaded && sansLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [sansLoaded, serifLoaded]);

  if (!serifLoaded || !sansLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor={colors.ivory} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

// Sentry.wrap installs an error boundary + routing instrumentation at the root.
// It's a no-op when Sentry is not initialized (missing DSN), so dev/local works.
export default Sentry.wrap(RootLayout);
