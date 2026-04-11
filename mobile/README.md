# UniMate Australia Mobile

Expo SDK 55 demo app for an AI-powered migration consultancy concept.

## Stack

- Expo SDK 55
- Expo Router tabs
- TypeScript
- NativeWind v4
- React Native Reanimated 4
- AsyncStorage for local profile persistence
- Mock data only in `lib/mockData.ts`

## Quickstart

1. `cd /Users/shamalkrishna/Desktop/claudeking.cloud/unimate-mobile`
2. `npm install`
3. `npx expo start --tunnel`
4. Open Expo Go on your phone
5. Scan the QR code from the terminal

## Project structure

- `app/(tabs)/index.tsx` editorial home feed
- `app/(tabs)/match.tsx` swipe-style university cards
- `app/(tabs)/chat.tsx` AI advisor demo
- `app/(tabs)/sop.tsx` SOP builder wizard
- `app/(tabs)/profile.tsx` onboarding + local persistence
- `lib/mockData.ts` all offline data and copy
- `lib/theme.ts` brand tokens and typography helpers

## Notes

- No backend is used
- No API calls are made for app state
- University imagery uses remote Unsplash URLs
- Fonts load from Expo Google Fonts packages
- Tabs are configured through Expo Router

## Verification

After installing dependencies:

1. `npm run typecheck`
2. `npm run prebuild:ios`

If Expo SDK versions change, align `expo`, `react-native`, and related Expo packages first.
