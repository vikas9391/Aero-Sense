import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:nfc_manager/nfc_manager_android.dart';

import 'core/api.dart';
import 'theme.dart';
import 'widgets.dart';

final nfcApi = Api();

class NfcCenterScreen extends StatefulWidget {
  const NfcCenterScreen({super.key});
  @override State<NfcCenterScreen> createState() => _NfcCenterState();
}

class _NfcCenterState extends State<NfcCenterScreen> {
  User? user;
  @override
  void initState() {
    super.initState();
    nfcApi.me().then((value) { if (mounted) setState(() => user = value); }).catchError((_) {});
  }
  bool get canBind {
    final role = (user?.role ?? '').toUpperCase();
    return role == 'COMPANY_ADMIN' || role == 'MANUFACTURER';
  }
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.fromLTRB(20, 18, 20, 110),
    children: [
      const Text('NFC & COMPONENT IDENTITY', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
      const SizedBox(height: 5),
      const Text('NFC Center', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
      const SizedBox(height: 6),
      const Text('Register a physical tag, bind it to a component, or verify an existing tag.', style: TextStyle(color: muted, height: 1.45)),
      const SizedBox(height: 20),
      _ActionCard(icon: Icons.verified_user_outlined, title: 'Verify existing tag', description: 'Read the NFC UID and immediately see the registered component and tag details.', button: 'Start verification', onTap: () => context.go('/verify'), primary: true),
      if (canBind) ...[
        const SizedBox(height: 12),
        _ActionCard(icon: Icons.add_box_outlined, title: 'Register component', description: 'Create the component identity before attaching a physical NFC tag.', button: 'Register component', onTap: () => context.go('/register-component')),
        const SizedBox(height: 12),
        _ActionCard(icon: Icons.link, title: 'Bind NFC tag', description: 'Attach a physical NFC tag to an existing aircraft component.', button: 'Bind tag', onTap: () => context.go('/register-tag')),
      ],
    ],
  );
}

class _ActionCard extends StatelessWidget {
  final IconData icon; final String title; final String description; final String button; final VoidCallback onTap; final bool primary;
  const _ActionCard({required this.icon, required this.title, required this.description, required this.button, required this.onTap, this.primary = false});
  @override
  Widget build(BuildContext context) => CardBox(
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, size: 30, color: primary ? accent : muted),
      const SizedBox(height: 12),
      Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
      const SizedBox(height: 6),
      Text(description, style: const TextStyle(color: muted, height: 1.4)),
      const SizedBox(height: 14),
      SizedBox(width: double.infinity, child: primary ? FilledButton.icon(onPressed: onTap, icon: Icon(icon), label: Text(button)) : OutlinedButton.icon(onPressed: onTap, icon: Icon(icon), label: Text(button))),
    ]),
  );
}

class NfcVerificationScreen extends StatefulWidget {
  const NfcVerificationScreen({super.key});
  @override State<NfcVerificationScreen> createState() => _NfcVerificationState();
}

class _NfcVerificationState extends State<NfcVerificationScreen> {
  static const _settings = MethodChannel('aero_sense/settings');
  bool scanning = false;
  bool _handlingTag = false;
  String? uid;
  String? error;
  VerificationResponse? result;

  Future<void> _openNfcSettings() async { try { await _settings.invokeMethod('openNfcSettings'); } catch (_) {} }

  Future<void> _stopReader() async {
    try {
      if (Platform.isAndroid) {
        await NfcManagerAndroid.instance.disableReaderMode();
      } else {
        await NfcManager.instance.stopSession();
      }
    } catch (_) {}
  }

  Future<void> _handleTag(NfcTag tag) async {
    // Reader mode can report the same physical tag more than once. Ignore
    // duplicate callbacks while the first verification is being processed.
    if (_handlingTag) return;
    _handlingTag = true;

    final identifier = _identifier(tag);
    if (identifier == null) {
      await _stopReader();
      if (mounted) setState(() { scanning = false; error = 'The NFC tag did not expose a readable identifier.'; });
      _handlingTag = false;
      return;
    }

    // Show the hardware UID immediately and release the NFC reader before the
    // network verification. This removes the API round-trip from the scan
    // detection path and prevents the phone from remaining in reader mode.
    if (mounted) setState(() { uid = identifier; error = null; scanning = false; });
    await _stopReader();

    try {
      final verification = await nfcApi.verifyNfc(identifier);
      if (mounted) setState(() => result = verification);
    } catch (e) {
      if (mounted) setState(() => error = nfcApi.errorMessage(e));
    } finally {
      _handlingTag = false;
    }
  }

  Future<void> _scan() async {
    if (scanning || _handlingTag) return;
    setState(() { scanning = true; uid = null; error = null; result = null; });
    try {
      final availability = await NfcManager.instance.checkAvailability();
      if (availability != NfcAvailability.enabled) {
        if (!mounted) return;
        setState(() {
          error = availability == NfcAvailability.disabled ? 'NFC is disabled on this phone.' : 'NFC is not available on this phone.';
          scanning = false;
        });
        return;
      }
      if (Platform.isAndroid) {
        // NTAG213/215/216 and most aircraft asset stickers use ISO 14443-A.
        // Restrict polling to the protocol we need for a faster detection.
        await NfcManagerAndroid.instance.enableReaderMode(
          flags: {
            NfcReaderFlagAndroid.nfcA,
            NfcReaderFlagAndroid.noPlatformSounds,
            NfcReaderFlagAndroid.skipNdefCheck,
          },
          onTagDiscovered: _handleTag,
        );
      } else {
        await NfcManager.instance.startSession(
          pollingOptions: {NfcPollingOption.iso14443, NfcPollingOption.iso15693},
          onDiscovered: _handleTag,
        );
      }
    } catch (e) {
      if (mounted) setState(() { error = nfcApi.errorMessage(e); scanning = false; });
      await _stopReader();
    }
  }

  String? _identifier(NfcTag tag) {
    if (Platform.isAndroid) {
      final android = NfcTagAndroid.from(tag);
      final bytes = android?.id;
      if (bytes == null || bytes.isEmpty) return null;
      return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
    }
    final iosTag = NfcTagIos.from(tag);
    if (iosTag != null) {
      final identifier = iosTag.identifier;
      if (identifier.isNotEmpty) return identifier.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
    }
    return null;
  }

  void _bindScannedTag() {
    final value = uid;
    if (value == null || value.isEmpty) return;
    context.go('/register-tag?uid=${Uri.encodeComponent(value)}');
  }

  @override
  Widget build(BuildContext context) {
    final children = <Widget>[
      const Text('NFC VERIFICATION', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
      const SizedBox(height: 5),
      const Text('Verify component identity', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
      const SizedBox(height: 6),
      const Text('Scan a registered tag to retrieve its component identity and update it with an auditable timestamp.', style: TextStyle(color: muted, height: 1.45)),
      const SizedBox(height: 18),
      CardBox(child: Column(children: [
        Icon(scanning ? Icons.contactless : Icons.nfc, size: 56, color: scanning ? accent : muted),
        const SizedBox(height: 8),
        Text(scanning ? 'Waiting for a tag…' : 'Tap Start Scan when the tag is ready.', style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
        if (uid != null) ...[const SizedBox(height: 8), Text('UID: $uid', style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w700))],
        const SizedBox(height: 14),
        SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: scanning ? null : _scan, icon: Icon(scanning ? Icons.hourglass_top : Icons.nfc), label: Text(scanning ? 'Scanning…' : 'Start Scan'))),
        const SizedBox(height: 8),
        TextButton.icon(onPressed: scanning ? null : _openNfcSettings, icon: const Icon(Icons.settings_outlined), label: const Text('Open NFC Settings')),
      ])),
    ];
    if (error != null) children.addAll([const SizedBox(height: 12), CardBox(child: Row(children: [const Icon(Icons.error_outline, color: Colors.red), const SizedBox(width: 10), Expanded(child: Text(error!, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w700)))]))]);
    if (result != null) children.addAll([const SizedBox(height: 12), _verificationResult(result!)]);
    if (uid != null && result == null) children.addAll([const SizedBox(height: 12), CardBox(child: Row(children: [const SizedBox(width: 4), const Icon(Icons.check_circle_outline, color: good), const SizedBox(width: 10), const Expanded(child: Text('Tag detected. Verifying component…', style: TextStyle(fontWeight: FontWeight.w700)))]))]);
    if (uid != null && canBindFromResult) children.addAll([const SizedBox(height: 12), SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: _bindScannedTag, icon: const Icon(Icons.link), label: const Text('Bind this scanned NFC tag'))]);
    return ListView(padding: const EdgeInsets.fromLTRB(20, 18, 20, 110), children: children);
  }

  bool get canBindFromResult => result == null;

  Widget _verificationResult(VerificationResponse value) => CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(value.finalResult, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)), const SizedBox(height: 10), Text(value.message ?? 'Verification completed.', style: const TextStyle(color: muted))]));
}
