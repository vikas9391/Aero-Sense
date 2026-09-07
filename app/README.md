# Aero-Sense Mobile

Flutter Android application for the Aero-Sense aircraft component intelligence platform.

## Stack

- Flutter / Dart
- Rust + Axum backend (shared with the web frontend)
- Dio for HTTP
- Flutter Secure Storage for JWT credentials
- NFC Manager for NFC tag verification

## Features

- JWT authentication
- Role-aware user profile
- Fleet analytics dashboard
- Aircraft component registry and search
- Component passport
- Maintenance history
- Verification history and audit activity
- NFC component verification
- Backend blockchain verification support

## API configuration

The mobile app is configured by default to use the deployed production backend:

```text
https://aero-sense-backend-0y3l.onrender.com/api
```

You can override it for another environment with:

```text
flutter run --dart-define=API_BASE_URL=https://YOUR_BACKEND_URL/api
```

## Run

```text
flutter pub get
flutter run
```

## Build APK

```text
flutter pub get
flutter analyze
flutter build apk --release
```

The Android application id should be `com.aerosense.mobile`.
