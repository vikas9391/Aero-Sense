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
          _ActionCard(icon: Icons.verified_user_outlined, title: 'Verify existing tag', description: 'Read the NFC UID and verify it. Registered tags return their component and tag details.', button: 'Start verification', onTap: () => context.go('/verify'), primary: true),
          const SizedBox(height: 12),
          if (canBind) ...[
            _ActionCard(icon: Icons.add_box_outlined, title: 'Register component', description: 'Create the component identity before attaching a physical NFC tag.', button: 'Register component', onTap: () => context.go('/register-component')),
            const SizedBox(height: 12),
            _ActionCard(icon: Icons.link_outlined, title: 'Bind NFC / RFID tag', description: 'Select a component, read its physical UID, and save the secure binding.', button: 'Bind physical tag', onTap: () => context.go('/register-tag')),
          ] else
            CardBox(child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [const Icon(Icons.info_outline, color: muted), const SizedBox(width: 12), Expanded(child: Text(user == null ? 'Loading your access permissions…' : 'Tag binding is available to Company Admin and Manufacturer accounts.', style: const TextStyle(color: muted, height: 1.45)))])),
          const SizedBox(height: 16),
          const CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('HOW THE NFC FLOW WORKS', style: TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
            SizedBox(height: 12),
            _Step(number: '01', title: 'Register component', text: 'Create the digital component record with its identity, aircraft and status.'),
            _Step(number: '02', title: 'Bind physical tag', text: 'Read the physical UID and attach it to the selected component.'),
            _Step(number: '03', title: 'Verify', text: 'Scan the same tag later to authenticate it and immediately display the component details.'),
          ])),
        ],
      );
}

class _ActionCard extends StatelessWidget {
  final IconData icon; final String title; final String description; final String button; final VoidCallback onTap; final bool primary;
  const _ActionCard({required this.icon, required this.title, required this.description, required this.button, required this.onTap, this.primary = false});
  @override
  Widget build(BuildContext context) => CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(width: 54, height: 54, decoration: BoxDecoration(color: primary ? const Color(0xFFE8E9F7) : soft, borderRadius: BorderRadius.circular(16)), child: Icon(icon, color: accent, size: 28)),
        const SizedBox(height: 16), Text(title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800)), const SizedBox(height: 6), Text(description, style: const TextStyle(color: muted, height: 1.45)), const SizedBox(height: 15),
        SizedBox(width: double.infinity, child: primary ? FilledButton.icon(onPressed: onTap, icon: Icon(icon), label: Text(button)) : OutlinedButton.icon(onPressed: onTap, icon: Icon(icon), label: Text(button))),
      ]));
}

class _Step extends StatelessWidget {
  final String number, title, text;
  const _Step({required this.number, required this.title, required this.text});
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(bottom: 12), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(number, style: const TextStyle(color: accent, fontWeight: FontWeight.w900, fontSize: 12)), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontWeight: FontWeight.w800)), const SizedBox(height: 2), Text(text, style: const TextStyle(color: muted, fontSize: 12, height: 1.4))])),
      ]));
}

class NfcVerificationScreen extends StatefulWidget {
  const NfcVerificationScreen({super.key});
  @override
  State<NfcVerificationScreen> createState() => _NfcVerificationState();
}

class _NfcVerificationState extends State<NfcVerificationScreen> {
  static const _settingsChannel = MethodChannel('aero_sense/settings');
  bool scanning = false, discovered = false;
  VerificationResponse? result;
  String? error, uid;

  Future<bool> _ensureNfcReady() async {
    final availability = await NfcManager.instance.checkAvailability();
    if (availability == NfcAvailability.enabled) return true;
    if (!mounted) return false;
    final openSettings = await showDialog<bool>(context: context, builder: (dialogContext) => AlertDialog(
      title: const Text('NFC is required'),
      content: const Text('Aero-Sense needs NFC enabled to read the physical tag UID. Enable NFC in Android Settings before scanning.'),
      actions: [TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Open NFC Settings'))],
    ));
    if (openSettings != true) return false;
    try { await _settingsChannel.invokeMethod<void>('openNfcSettings'); } catch (_) { if (mounted) setState(() => error = 'Unable to open NFC settings. Enable NFC manually in Android Settings.'); }
    return false;
  }

  Future<void> scan() async {
    if (scanning) return;
    setState(() { scanning = true; discovered = false; result = null; error = null; uid = null; });
    try {
      if (!await _ensureNfcReady()) { if (mounted) setState(() => scanning = false); return; }
      await NfcManager.instance.startSession(
        pollingOptions: {NfcPollingOption.iso14443, NfcPollingOption.iso15693, NfcPollingOption.iso18092},
        onDiscovered: (tag) async {
          if (discovered) return;
          discovered = true;
          try {
            final androidTag = NfcTagAndroid.from(tag);
            if (androidTag == null || androidTag.id.isEmpty) throw Exception('The phone detected an NFC tag but could not read its UID.');
            final identifier = androidTag.id.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
            if (mounted) setState(() => uid = identifier);
            final verification = await nfcApi.verifyNfc(identifier);
            if (mounted) setState(() => result = verification);
          } catch (e) { if (mounted) setState(() => error = nfcApi.errorMessage(e)); }
          finally { await NfcManager.instance.stopSession(); if (mounted) setState(() => scanning = false); }
        },
      );
    } catch (e) { if (mounted) setState(() { error = nfcApi.errorMessage(e); scanning = false; }); }
  }

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
        children: [
          const Text('SECURE TAG CHECK', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)), const SizedBox(height: 5),
          const Text('Verify component', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)), const SizedBox(height: 6),
          const Text('Scan a registered physical NFC tag and validate the component identity.', style: TextStyle(color: muted, height: 1.45)), const SizedBox(height: 20),
          CardBox(child: Column(children: [
            AnimatedContainer(duration: const Duration(milliseconds: 250), width: 112, height: 112, decoration: BoxDecoration(color: scanning ? const Color(0xFFE8E9F7) : soft, shape: BoxShape.circle), child: Icon(scanning ? Icons.sensors_outlined : Icons.nfc_outlined, color: accent, size: 54)),
            const SizedBox(height: 18), Text(scanning ? 'READY — HOLD TAG NEAR PHONE' : 'NFC READER READY', style: const TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.15), textAlign: TextAlign.center), const SizedBox(height: 8),
            Text(scanning ? 'Waiting for a tag…' : 'Tap Start Scan when the tag is ready.', style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800), textAlign: TextAlign.center), const SizedBox(height: 8),
            const Text('Keep the NFC area of the phone close to the physical tag until it is detected. The UID is then sent to the backend for verification.', textAlign: TextAlign.center, style: TextStyle(color: muted, height: 1.5)), const SizedBox(height: 18),
            SizedBox(width: double.infinity, height: 52, child: FilledButton.icon(onPressed: scanning ? null : scan, icon: Icon(scanning ? Icons.sensors : Icons.nfc), label: Text(scanning ? 'Waiting for tag…' : 'Start NFC scan')),
            if (uid != null) ...[const SizedBox(height: 16), Container(width: double.infinity, padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(14)), child: Row(children: [const Icon(Icons.tag_outlined, size: 18, color: muted), const SizedBox(width: 9), Expanded(child: Text(uid!, style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 1.0)))]))],
          ])),
          if (error != null) ...[
            const SizedBox(height: 12), CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Row(crossAxisAlignment: CrossAxisAlignment.start, children: [const Icon(Icons.error_outline, color: Colors.red), const SizedBox(width: 10), Expanded(child: Text('NFC verification could not be completed.', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700)))]), const SizedBox(height: 6), Text(error!, style: const TextStyle(color: Colors.red, height: 1.4)), if (error!.toLowerCase().contains('not registered')) ...[const SizedBox(height: 12), SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: () => context.go('/register-tag'), icon: const Icon(Icons.link), label: const Text('Register / bind this tag')))] ])),
          ],
          if (result != null) ...[const SizedBox(height: 12), VerificationResultCard(result: result!)],
        ],
      );
}

class VerificationResultCard extends StatefulWidget {
  final VerificationResponse result;
  const VerificationResultCard({required this.result, super.key});
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
    } finally { if (mounted) setState(() => openingPassport = false); }
  }

  @override
  Widget build(BuildContext context) {
    final result = widget.result;
    final passed = result.verified;
    final data = result.component;
    return CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(passed ? Icons.check_circle : Icons.cancel, color: passed ? good : Colors.red, size: 30), const SizedBox(width: 10), Expanded(child: Text(passed ? 'AUTHENTIC COMPONENT' : 'VERIFICATION FAILED', style: TextStyle(color: passed ? good : Colors.red, fontSize: 18, fontWeight: FontWeight.w900))) ]),
      if (data != null) ...[
        const SizedBox(height: 18),
        _dataSection('COMPONENT DETAILS', [
          _detail('Serial Number', data['serial_number']), _detail('Component Type', data['component_type']), _detail('Manufacturer', data['manufacturer']), _detail('Status', data['status']), _detail('Aircraft', data['aircraft']), _detail('Component ID', data['id']),
        ], filled: true),
        const SizedBox(height: 12),
        _dataSection('NFC TAG DETAILS', [
          _detail('Identifier', data['tag_identifier']), _detail('Technology', data['tag_technology']), _detail('Security', data['tag_security_type']), _detail('Tamper status', data['tag_tamper_status']), _detail('Registered', data['tag_registered_at']),
        ]),
        const SizedBox(height: 12),
        SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: openingPassport ? null : _openPassport, icon: Icon(openingPassport ? Icons.hourglass_top : Icons.badge_outlined), label: Text(openingPassport ? 'Opening passport…' : 'Open full component passport')),
      ] else if (!passed) ...[
        const SizedBox(height: 12), const Text('This NFC tag is not bound to a component yet. Bind it first, then scan again to display the component data.', style: TextStyle(color: muted, height: 1.45)), const SizedBox(height: 12), SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: () => context.go('/register-tag'), icon: const Icon(Icons.link), label: const Text('Bind this NFC tag')),
      ],
      if (result.checks.isNotEmpty) ...[const Divider(height: 26), ...result.checks.entries.map((entry) => Padding(padding: const EdgeInsets.only(bottom: 9), child: Row(children: [Icon(entry.value ? Icons.check_circle_outline : Icons.cancel_outlined, color: entry.value ? good : Colors.red, size: 18), const SizedBox(width: 8), Expanded(child: Text(_label(entry.key), style: const TextStyle(fontWeight: FontWeight.w600))), Text(entry.value ? 'PASS' : 'FAIL', style: TextStyle(fontWeight: FontWeight.w900, color: entry.value ? good : Colors.red))])))],
      if (result.reason != null && result.reason!.isNotEmpty) ...[const SizedBox(height: 4), Text(result.reason!, style: const TextStyle(color: Colors.red, height: 1.4))],
    ]));
  }

  Widget _dataSection(String title, List<Widget> children, {bool filled = false}) => Container(width: double.infinity, padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: filled ? soft : null, border: filled ? null : Border.all(color: soft), borderRadius: BorderRadius.circular(16)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.1)), const SizedBox(height: 10), ...children]));

  Widget _detail(String label, Object? value) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [SizedBox(width: 112, child: Text(label, style: const TextStyle(color: muted, fontSize: 12))), const SizedBox(width: 8), Expanded(child: Text('${value ?? '—'}', style: const TextStyle(fontWeight: FontWeight.w700, height: 1.3)))]));

  String _label(String value) => value.replaceAll('_', ' ').replaceFirstMapped(RegExp(r'^.'), (m) => m.group(0)!.toUpperCase());
}
