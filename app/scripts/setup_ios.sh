#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v flutter >/dev/null 2>&1; then
  echo "Flutter is required. Install Flutter and run this script again."
  exit 1
fi

# Generate the native iOS runner without changing the existing Dart/Android code.
flutter create --platforms=ios .

# NFC requires iOS 13+.
if [ -f ios/Podfile ]; then
  sed -i.bak "s/# platform :ios, '.*'/platform :ios, '13.0'/" ios/Podfile || true
  rm -f ios/Podfile.bak
fi

# Add the NFC usage description required by Core NFC.
/usr/libexec/PlistBuddy -c "Add :NFCReaderUsageDescription string 'Aero-Sense uses NFC to identify and verify aircraft components.'" ios/Runner/Info.plist 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Set :NFCReaderUsageDescription 'Aero-Sense uses NFC to identify and verify aircraft components.'" ios/Runner/Info.plist

# Add the Core NFC reader entitlement.
cat > ios/Runner/Runner.entitlements <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.developer.nfc.readersession.formats</key>
	<array>
		<string>TAG</string>
	</array>
</dict>
</plist>
EOF

# iOS does not expose a dedicated NFC Settings screen. The app-settings action
# is provided by the shared Flutter UI when the user requests settings.
flutter pub get

echo "iOS platform scaffold and Core NFC configuration created."
echo "Open ios/Runner.xcworkspace in Xcode, select a development team, enable the Near Field Communication Tag Reading capability, and run on a physical NFC-capable iPhone."
