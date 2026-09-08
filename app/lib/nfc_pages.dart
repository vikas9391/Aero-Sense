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
          const SizedBox(height: 12),
          if (canBind) ...[
            _ActionCard(icon: Icons.add_box_outlined, title: 'Register component', description: 'Create the component identity before attaching a physical NFC tag.', button: 'Register component', onTap: () => context.go('/register-component')),
            const SizedBox(height: 12),
            _ActionCard(icon: Icons.link, title: 'Bind NFC tag', description: 'Attach a physical NFC tag to an existing aircraft component.', button: 'Bind tag', onTap: () => context.go('/register-tag')),
          ],
        ],
      );
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
  @override
  State<NfcVerificationScreen> createState() => _NfcVerificationState();
}

class _NfcVerificationState extends State<NfcVerificationScreen> {
  bool scanning = false;
  String? uid;
  String? error;
  VerificationResponse? result;

  static const _settings = MethodChannel('aero_sense/settings');

  Future<void> _openNfcSettings() async {
    try {
      await _settings.invokeMethod('openNfcSettings');
    } catch (_) {}
  }

  Future<void> _scan() async {
    setState(() {
      scanning = true;
      uid = null;
      error = null;
      result = null;
    });

    try {
      final availability = await NfcManager.instance.checkAvailability();
      if (availability != NfcAvailability.enabled) {
        if (mounted) {
          setState(() {
            error = availability == NfcAvailability.disabled ? 'NFC is disabled on this phone.' : 'NFC is not available on this phone.';
            scanning = false;
          });
        }
        return;
      }

      await NfcManager.instance.startSession(
        pollingOptions: {NfcPollingOption.iso14443, NfcPollingOption.iso15693, NfcPollingOption.iso18092},
        onDiscovered: (tag) async {
          final identifier = _identifier(tag);
          if (identifier == null) {
            await NfcManager.instance.stopSession(errorMessageIos: 'Unable to read NFC identifier');
            if (mounted) setState(() { scanning = false; error = 'The NFC tag did not expose a readable identifier.'; });
            return;
          }

          uid = identifier;
          try {
            final verification = await nfcApi.verifyNfc(identifier);
            if (mounted) setState(() { result = verification; scanning = false; });
          } catch (e) {
            if (mounted) setState(() { error = nfcApi.errorMessage(e); scanning = false; });
          } finally {
            await NfcManager.instance.stopSession();
          }
        },
      );
    } catch (e) {
      if (mounted) setState(() { error = nfcApi.errorMessage(e); scanning = false; });
      try { await NfcManager.instance.stopSession(); } catch (_) {}
    }
  }

  String? _identifier(NfcTag tag) {
    final android = NfcTagAndroid.from(tag);
    final bytes = android?.id;
    if (bytes == null || bytes.isEmpty) return null;
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
  }

  void _bindScannedTag() {
    final value = uid;
    if (value == null || value.isEmpty) return;
    context.go('/register-tag?uid=${Uri.encodeComponent(value)}');
  }

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 110),
        children: [
          const Text('NFC VERIFICATION', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
          const SizedBox(height: 5),
          const Text('Verify component identity', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          const Text('Scan a registered tag to retrieve its component identity and verification history.', style: TextStyle(color: muted, height: 1.45)),
          const SizedBox(height: 18),
          CardBox(child: Column(children: [
            Icon(scanning ? Icons.contactless : Icons.nfc, size: 56, color: scanning ? accent : muted),
            const SizedBox(height: 8),
            Text(scanning ? 'Waiting for a tag…' : 'Tap Start Scan when the tag is ready.', style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
            const SizedBox(height: 8),
            if (uid != null) Text('UID: $uid', style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w700)),
            const SizedBox(height: 14),
            SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: scanning ? null : _scan, icon: Icon(scanning ? Icons.hourglass_top : Icons.nfc), label: Text(scanning ? 'Scanning…' : 'Start Scan'))),
            const SizedBox(height: 8),
            TextButton.icon(onPressed: scanning ? null : _openNfcSettings, icon: const Icon(Icons.settings_outlined), label: const Text('Open NFC Settings')),
          ])),
          if (error != null) ...[
            const SizedBox(height: 12),
            CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(Icons.error_outline, color: Colors.red), SizedBox(width: 10), Expanded(child: Text('NFC verification could not be completed.', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700)))]),
              const SizedBox(height: 6),
              Text(error!, style: const TextStyle(color: Colors.red, height: 1.4)),
              if (uid != null) ...[
                const SizedBox(height: 12),
                SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: _bindScannedTag, icon: const Icon(Icons.link), label: const Text('Register / bind this scanned tag'))),
              ],
            ])),
          ],
          if (result != null) ...[
            const SizedBox(height: 12),
            VerificationResultCard(result: result!, scannedUid: uid),
          ],
        ],
      );
}

class VerificationResultCard extends StatefulWidget {
  final VerificationResponse result;
  final String? scannedUid;
  const VerificationResultCard({required this.result, this.scannedUid, super.key});
  @override
  State<VerificationResultCard> createState() => _VerificationResultCardState();
}

class _VerificationResultCardState extends State<VerificationResultCard> {
  bool openingPassport = false;

  Future<void> _openPassport() async {
    final databaseId = widget.result.component?['database_id'];
    if (databaseId is! num) return;
    setState(() => openingPassport = true);
    try {
      final component = await nfcApi.component(databaseId.toInt());
      if (mounted) context.go('/passport', extra: component);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(nfcApi.errorMessage(e)), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => openingPassport = false);
    }
  }

  void _bind() {
    final value = widget.scannedUid;
    if (value == null || value.isEmpty) return;
    context.go('/register-tag?uid=${Uri.encodeComponent(value)}');
  }

  @override
  Widget build(BuildContext context) {
    final result = widget.result;
    final passed = result.verified;
    final data = result.component;

    final children = <Widget>[
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(passed ? Icons.check_circle : Icons.cancel, color: passed ? good : Colors.red, size: 30),
        const SizedBox(width: 10),
        Expanded(child: Text(passed ? 'AUTHENTIC COMPONENT' : 'VERIFICATION FAILED', style: TextStyle(color: passed ? good : Colors.red, fontSize: 18, fontWeight: FontWeight.w900))),
      ]),
    ];

    if (data != null) {
      children.addAll([
        const SizedBox(height: 18),
        _dataSection('COMPONENT DETAILS', [
          _detail('Serial Number', data['serial_number']),
          _detail('Component Type', data['component_type']),
          _detail('Manufacturer', data['manufacturer']),
          _detail('Status', data['status']),
          _detail('Aircraft', data['aircraft']),
          _detail('Component ID', data['id']),
        ], filled: true),
        const SizedBox(height: 12),
        _dataSection('NFC TAG DETAILS', [
          _detail('Identifier', data['tag_identifier']),
          _detail('Technology', data['tag_technology']),
          _detail('Security', data['tag_security_type']),
          _detail('Tamper status', data['tag_tamper_status']),
          _detail('Registered', data['tag_registered_at']),
        ]),
        const SizedBox(height: 12),
        SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: openingPassport ? null : _openPassport, icon: Icon(openingPassport ? Icons.hourglass_top : Icons.badge_outlined), label: Text(openingPassport ? 'Opening passport…' : 'Open full component passport')),
      ]);
    } else if (!passed) {
      children.addAll([
        const SizedBox(height: 12),
        const Text('This NFC tag is not bound to a component yet. Its scanned UID is preserved for the binding form.', style: TextStyle(color: muted, height: 1.45)),
        const SizedBox(height: 12),
        SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: _bind, icon: const Icon(Icons.link), label: const Text('Bind this scanned NFC tag'))),
      ]);
    }

    if (result.reason != null && result.reason!.trim().isNotEmpty) {
      children.addAll([
        const SizedBox(height: 12),
        Text(result.reason!, style: TextStyle(color: passed ? muted : Colors.red, height: 1.4)),
      ]);
    }

    if (result.checks.isNotEmpty) {
      children.add(const Divider(height: 26));
      for (final entry in result.checks.entries) {
        children.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 9),
            child: Row(children: [
              Icon(entry.value ? Icons.check_circle_outline : Icons.cancel_outlined, color: entry.value ? good : Colors.red, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(_label(entry.key), style: const TextStyle(fontWeight: FontWeight.w600))),
              Text(entry.value ? 'PASS' : 'FAIL', style: TextStyle(fontWeight: FontWeight.w900, color: entry.value ? good : Colors.red)),
            ]),
          ),
        );
      }
    }

    return CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children));
  }

  Widget _dataSection(String title, List<Widget> children, {bool filled = false}) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: filled ? soft : null, border: filled ? null : Border.all(color: soft), borderRadius: BorderRadius.circular(16)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.1)), const SizedBox(height: 10), ...children]),
      );

  Widget _detail(String label, Object? value) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [SizedBox(width: 112, child: Text(label, style: const TextStyle(color: muted, fontSize: 12))), const SizedBox(width: 8), Expanded(child: Text('${value ?? '—'}', style: const TextStyle(fontWeight: FontWeight.w700, height: 1.3)))]),
      );

  String _label(String value) => value.replaceAll('_', ' ').replaceFirstMapped(RegExp(r'^.'), (m) => m.group(0)!.toUpperCase());
}