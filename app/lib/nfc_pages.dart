import 'package:flutter/material.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:nfc_manager/nfc_manager_android.dart';

import 'core/api.dart';
import 'registration_pages.dart';
import 'theme.dart';
import 'widgets.dart';

final nfcApi = Api();

class NfcCenterScreen extends StatefulWidget {
  const NfcCenterScreen({super.key});

  @override
  State<NfcCenterScreen> createState() => _NfcCenterState();
}

class _NfcCenterState extends State<NfcCenterScreen> {
  User? user;

  @override
  void initState() {
    super.initState();
    nfcApi.me().then((value) {
      if (mounted) setState(() => user = value);
    }).catchError((_) {});
  }

  bool get canBind {
    final role = (user?.role ?? '').toUpperCase();
    return role == 'COMPANY_ADMIN' || role == 'MANUFACTURER';
  }

  void _open(Widget page) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    final content = ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
      children: [
        const Text('NFC & COMPONENT IDENTITY', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
        const SizedBox(height: 5),
        const Text('NFC Center', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        const Text('Register a physical tag, bind it to a component, or verify an existing tag.', style: TextStyle(color: muted, height: 1.45)),
        const SizedBox(height: 20),
        _ActionCard(
          icon: Icons.verified_user_outlined,
          title: 'Verify existing tag',
          description: 'Read the NFC UID and run the complete Aero-Sense verification pipeline.',
          button: 'Start verification',
          onTap: () => _open(const NfcVerificationScreen()),
          primary: true,
        ),
        const SizedBox(height: 12),
        if (canBind) ...[
          _ActionCard(
            icon: Icons.add_box_outlined,
            title: 'Register component',
            description: 'Create the component identity before attaching a physical NFC tag.',
            button: 'Register component',
            onTap: () => _open(const RegisterComponentScreen()),
          ),
          const SizedBox(height: 12),
          _ActionCard(
            icon: Icons.link_outlined,
            title: 'Bind NFC / RFID tag',
            description: 'Select a component, read its physical UID, and save the secure binding.',
            button: 'Bind physical tag',
            onTap: () => _open(const RegisterTagScreen()),
          ),
        ] else ...[
          CardBox(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline, color: muted),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    user == null ? 'Loading your access permissions…' : 'Tag binding is available to Company Admin and Manufacturer accounts. Sign in with one of those roles to register a physical tag.',
                    style: const TextStyle(color: muted, height: 1.45),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        const CardBox(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('HOW THE NFC FLOW WORKS', style: TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
              SizedBox(height: 12),
              _Step(number: '01', title: 'Register component', text: 'Create the digital component record.'),
              _Step(number: '02', title: 'Bind physical tag', text: 'Read the tag UID and attach it to that component.'),
              _Step(number: '03', title: 'Verify', text: 'Scan the same tag later to authenticate the component.'),
            ],
          ),
        ),
      ],
    );

    return MediaQuery(
      data: MediaQuery.of(context).copyWith(textScaler: TextScaler.noScaling),
      child: content,
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final String button;
  final VoidCallback onTap;
  final bool primary;

  const _ActionCard({required this.icon, required this.title, required this.description, required this.button, required this.onTap, this.primary = false});

  @override
  Widget build(BuildContext context) {
    return CardBox(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(color: primary ? const Color(0xFFE8E9F7) : soft, borderRadius: BorderRadius.circular(16)),
            child: Icon(icon, color: accent, size: 28),
          ),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(description, style: const TextStyle(color: muted, height: 1.45)),
          const SizedBox(height: 15),
          SizedBox(
            width: double.infinity,
            child: primary
                ? FilledButton.icon(onPressed: onTap, icon: Icon(icon), label: Text(button))
                : OutlinedButton.icon(onPressed: onTap, icon: Icon(icon), label: Text(button)),
          ),
        ],
      ),
    );
  }
}

class _Step extends StatelessWidget {
  final String number;
  final String title;
  final String text;

  const _Step({required this.number, required this.title, required this.text});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(number, style: const TextStyle(color: accent, fontWeight: FontWeight.w900, fontSize: 12)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 2),
                  Text(text, style: const TextStyle(color: muted, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      );
}

class NfcVerificationScreen extends StatefulWidget {
  const NfcVerificationScreen({super.key});

  @override
  State<NfcVerificationScreen> createState() => _NfcVerificationState();
}

class _NfcVerificationState extends State<NfcVerificationScreen> {
  bool scanning = false;
  bool discovered = false;
  VerificationResponse? result;
  String? error;
  String? uid;

  Future<void> scan() async {
    if (scanning) return;
    setState(() {
      scanning = true;
      discovered = false;
      result = null;
      error = null;
      uid = null;
    });

    try {
      final availability = await NfcManager.instance.checkAvailability();
      if (availability != NfcAvailability.enabled) {
        throw Exception('NFC is disabled or unavailable. Turn on NFC in Android Settings and try again.');
      }

      await NfcManager.instance.startSession(
        pollingOptions: {
          NfcPollingOption.iso14443,
          NfcPollingOption.iso15693,
          NfcPollingOption.iso18092,
        },
        onDiscovered: (tag) async {
          if (discovered) return;
          discovered = true;
          try {
            final androidTag = NfcTagAndroid.from(tag);
            if (androidTag == null || androidTag.id.isEmpty) {
              throw Exception('The phone detected an NFC tag but could not read its UID.');
            }
            final identifier = androidTag.id.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
            if (mounted) setState(() => uid = identifier);
            final verification = await nfcApi.verifyNfc(identifier);
            if (mounted) setState(() => result = verification);
          } catch (e) {
            if (mounted) setState(() => error = nfcApi.errorMessage(e));
          } finally {
            await NfcManager.instance.stopSession();
            if (mounted) setState(() => scanning = false);
          }
        },
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          error = nfcApi.errorMessage(e);
          scanning = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final content = ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
      children: [
        const Text('SECURE TAG CHECK', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
        const SizedBox(height: 5),
        const Text('Verify component', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        const Text('Scan a registered physical NFC tag and validate the component identity.', style: TextStyle(color: muted, height: 1.45)),
        const SizedBox(height: 20),
        CardBox(
          child: Column(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                width: 112,
                height: 112,
                decoration: BoxDecoration(color: scanning ? const Color(0xFFE8E9F7) : soft, shape: BoxShape.circle),
                child: Icon(scanning ? Icons.sensors_outlined : Icons.nfc_outlined, color: accent, size: 54),
              ),
              const SizedBox(height: 18),
              Text(scanning ? 'READY — HOLD TAG NEAR PHONE' : 'NFC READER READY', style: const TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.15), textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Text(scanning ? 'Waiting for a tag…' : 'Tap Start Scan when the tag is ready.', style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
              const SizedBox(height: 8),
              const Text('Keep the NFC area of the phone close to the physical tag until it is detected. The UID is then sent to the backend for verification.', textAlign: TextAlign.center, style: TextStyle(color: muted, height: 1.5)),
              const SizedBox(height: 18),
              SizedBox(width: double.infinity, height: 52, child: FilledButton.icon(onPressed: scanning ? null : scan, icon: Icon(scanning ? Icons.sensors : Icons.nfc), label: Text(scanning ? 'Waiting for tag…' : 'Start NFC scan'))),
              if (uid != null) ...[
                const SizedBox(height: 16),
                Container(width: double.infinity, padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(14)), child: Row(children: [const Icon(Icons.tag_outlined, size: 18, color: muted), const SizedBox(width: 9), Expanded(child: Text(uid!, style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 1.0)))])),
              ],
            ],
          ),
        ),
        if (error != null) ...[
          const SizedBox(height: 12),
          CardBox(child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [const Icon(Icons.error_outline, color: Colors.red), const SizedBox(width: 10), Expanded(child: Text(error!, style: const TextStyle(color: Colors.red, height: 1.4)))])),
        ],
        if (result != null) ...[
          const SizedBox(height: 12),
          VerificationResultCard(result: result!),
        ],
      ],
    );

    return MediaQuery(
      data: MediaQuery.of(context).copyWith(textScaler: TextScaler.noScaling),
      child: content,
    );
  }
}

class VerificationResultCard extends StatelessWidget {
  final VerificationResponse result;

  const VerificationResultCard({required this.result, super.key});

  @override
  Widget build(BuildContext context) {
    final passed = result.verified;
    return CardBox(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(passed ? Icons.check_circle : Icons.cancel, color: passed ? good : Colors.red, size: 30),
              const SizedBox(width: 10),
              Expanded(child: Text(passed ? 'AUTHENTIC COMPONENT' : 'VERIFICATION FAILED', style: TextStyle(color: passed ? good : Colors.red, fontSize: 18, fontWeight: FontWeight.w900))),
            ],
          ),
          if (result.component != null) ...[
            const SizedBox(height: 12),
            Text('${result.component!['serial_number'] ?? 'Unknown serial'}', style: const TextStyle(fontWeight: FontWeight.w800)),
            Text('${result.component!['component_type'] ?? ''} · ${result.component!['aircraft'] ?? 'Unassigned'}', style: const TextStyle(color: muted)),
          ],
          if (result.checks.isNotEmpty) ...[
            const Divider(height: 26),
            ...result.checks.entries.map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 9),
                child: Row(
                  children: [
                    Icon(entry.value ? Icons.check_circle_outline : Icons.cancel_outlined, color: entry.value ? good : Colors.red, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_label(entry.key), style: const TextStyle(fontWeight: FontWeight.w600))),
                    Text(entry.value ? 'PASS' : 'FAIL', style: TextStyle(fontWeight: FontWeight.w900, color: entry.value ? good : Colors.red)),
                  ],
                ),
              ),
            ),
          ],
          if (result.reason != null && result.reason!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(result.reason!, style: const TextStyle(color: Colors.red, height: 1.4)),
          ],
        ],
      ),
    );
  }

  String _label(String value) => value.replaceAll('_', ' ').replaceFirstMapped(RegExp(r'^.'), (m) => m.group(0)!.toUpperCase());
}
