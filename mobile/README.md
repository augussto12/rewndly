# Rewndly Mobile

Expo/React Native app for Android and iOS.

## Run locally

```bash
npm install
npm run start
```

Use Expo Go or a development build. The app points to `https://rewndly.com` by default through `app.json > expo.extra.apiBaseUrl`.

## Useful commands

```bash
npm run typecheck
npx expo export --platform android --output-dir dist-android
npm run build:android
npm run build:ios
```

## Auth model

The app uses `/api/mobile/auth/*` endpoints. Access tokens live in memory; refresh tokens are stored with `expo-secure-store`.

## EAS

Before production builds, replace the placeholder `extra.eas.projectId` in `app.json` by running:

```bash
npx eas-cli@latest init
```

Then use the profiles in `eas.json`.
