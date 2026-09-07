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

Android emulator default:

```text
http://10.0.2.2:8080/api
```

For a physical Android phone, use the computer's LAN address:

```text
flutter run --dart-define=API_BASE_URL=http://YOUR_PC_IP:8080/api
```

The backend must listen on `0.0.0.0:8080` and the phone and computer must be on the same network.

## Run

```text
flutter pub get
flutter run
```

## Android project

If `android/` is not present locally, generate the Android platform files with:

```text
flutter create . --platforms android --org com.aerosense --project-name aero_sense_mobile
```

Then run:

```text
flutter pub get
flutter analyze
flutter build apk --debug
```

The Android application id should be `com.aerosense.mobile`.
