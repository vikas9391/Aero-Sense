# Aero-Sense Mobile

Android-first field app for the Aero-Sense aircraft component verification platform.

## Backend

The app uses the existing Rust/Axum backend in ../backend. Set the API origin with:

```bash
EXPO_PUBLIC_API_URL=https://your-api.example.com/api
```

For a local Android emulator use `http://10.0.2.2:8080/api`. For a physical phone, use the computer's LAN IP, for example `http://192.168.1.20:8080/api`.

## Run

```bash
cd app
npm install
npx expo prebuild
npx expo run:android
```

NFC requires a development/native Android build; Expo Go is not sufficient.

## Included workflows

- Secure JWT login
- Role-aware dashboard
- Aircraft and component lookup
- NFC tag scanning and server verification
- Component maintenance history
- Technician maintenance entry
- Verification result and audit log display

No new backend is introduced: all data is read/written through the existing /api routes.
