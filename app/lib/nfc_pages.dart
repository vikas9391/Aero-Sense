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
  String? uid;
  String? error;
  VerificationResponse? result;

  Future<void> _openNfcSettings() async { try { await _settings.invokeMethod('openNfcSettings'); } catch (_) {} }

  Future<void> _handleTag(NfcTag tag) async {
    final identifier = _identifier(tag);
    if (identifier == null) {
      if (Platform.isAndroid) {
        await NfcManagerAndroid.instance.disableReaderMode();
      } else {
        await NfcManager.instance.stopSession(errorMessageIos: 'Unable to read NFC identifier');
      }
      if (mounted) setState(() { scanning = false; error = 'The NFC tag did not expose a readable identifier.'; });
      return;
    }
    if (mounted) setState(() => uid = identifier);
    try {
      final verification = await nfcApi.verifyNfc(identifier);
      if (mounted) setState(() { result = verification; scanning = false; });
    } catch (e) {
      if (mounted) setState(() { error = nfcApi.errorMessage(e); scanning = false; });
    } finally {
      if (Platform.isAndroid) {
        await NfcManagerAndroid.instance.disableReaderMode();
      } else {
        await NfcManager.instance.stopSession();
      }
    }
  }

  Future<void> _scan() async {
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
        await NfcManagerAndroid.instance.enableReaderMode(
          flags: {
            NfcReaderFlagAndroid.nfcA,
            NfcReaderFlagAndroid.nfcB,
            NfcReaderFlagAndroid.nfcF,
            NfcReaderFlagAndroid.nfcV,
            NfcReaderFlagAndroid.nfcBarcode,
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
      if (Platform.isAndroid) {
        try { await NfcManagerAndroid.instance.disableReaderMode(); } catch (_) {}
      } else {
        try { await NfcManager.instance.stopSession(); } catch (_) {}
      }
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
      if (identifier.isNotEmpty) {
        return identifier.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
      }
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
    if (error != null) {
      children.add(const SizedBox(height: 12));
      children.add(CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [Icon(Icons.error_outline, color: Colors.red), SizedBox(width: 10), Expanded(child: Text('NFC verification could not be completed.', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700)))]),
        const SizedBox(height: 6),
        Text(error!, style: const TextStyle(color: Colors.red, height: 1.4)),
        if (uid != null) ...[const SizedBox(height: 12), SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: _bindScannedTag, icon: const Icon(Icons.link), label: const Text('Register / bind this scanned tag')))],
      ])));
    }
    if (result != null) {
      children.add(const SizedBox(height: 12));
      children.add(VerificationResultCard(result: result!, scannedUid: uid));
    }
    return ListView(padding: const EdgeInsets.fromLTRB(20, 18, 20, 110), children: children);
  }
}

class VerificationResultCard extends StatefulWidget {
  final VerificationResponse result;
  final String? scannedUid;
  const VerificationResultCard({required this.result, this.scannedUid, super.key});
  @override State<VerificationResultCard> createState() => _VerificationResultCardState();
}

class _VerificationResultCardState extends State<VerificationResultCard> {
  bool editing = false, loadingHistory = false, saving = false;
  List<ComponentUpdateHistory> history = [];
  List<Aircraft> aircraft = [];
  String? selectedAircraft;
  late final TextEditingController serial = TextEditingController(text: widget.result.component?['serial_number']?.toString() ?? '');
  late final TextEditingController type = TextEditingController(text: widget.result.component?['component_type']?.toString() ?? '');
  late final TextEditingController manufacturer = TextEditingController(text: widget.result.component?['manufacturer']?.toString() ?? '');
  late String status = widget.result.component?['status']?.toString() ?? 'OPERATIONAL';

  @override void dispose() { serial.dispose(); type.dispose(); manufacturer.dispose(); super.dispose(); }

  Future<void> _loadHistory(int id) async {
    if (mounted) setState(() => loadingHistory = true);
    try {
      final loaded = await nfcApi.componentUpdateHistory(id);
      if (mounted) setState(() => history = loaded);
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Unable to load update history.')));
    } finally {
      if (mounted) setState(() => loadingHistory = false);
    }
  }

  Future<void> _startEdit() async {
    final data = widget.result.component;
    final id = data?['database_id'];
    if (id is! num) return;
    setState(() { editing = true; selectedAircraft = data?['aircraft_id']?.toString(); });
    try {
      final loaded = await nfcApi.aircraft();
      if (mounted) setState(() => aircraft = loaded);
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Aircraft list could not be loaded.')));
    }
  }

  Future<void> _saveEdit() async {
    final id = widget.result.component?['database_id'];
    if (id is! num) return;
    if (serial.text.trim().isEmpty || type.text.trim().isEmpty || manufacturer.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Serial number, component type and manufacturer are required.')));
      return;
    }
    setState(() => saving = true);
    try {
      final updated = await nfcApi.updateComponent(id.toInt(), {
        'aircraft_id': selectedAircraft == null ? null : int.tryParse(selectedAircraft!),
        'serial_number': serial.text.trim(),
        'component_type': type.text.trim(),
        'manufacturer': manufacturer.text.trim(),
        'status': status,
      });
      widget.result.component?.addAll({
        'serial_number': updated.serial,
        'component_type': updated.type,
        'manufacturer': updated.manufacturer,
        'status': updated.status,
        'aircraft': updated.aircraftRegistration ?? 'Unassigned',
        'aircraft_id': updated.aircraftId,
        'updated_at': updated.updatedAt,
      });
      setState(() => editing = false);
      await _loadHistory(id.toInt());
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Component updated and timestamped successfully.')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(nfcApi.errorMessage(e)), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  void _bind(BuildContext context) {
    final value = widget.scannedUid;
    if (value == null || value.isEmpty) return;
    context.go('/register-tag?uid=${Uri.encodeComponent(value)}');
  }

  Future<void> _openPassport(BuildContext context) async {
    final databaseId = widget.result.component?['database_id'];
    if (databaseId is! num) return;
    try {
      final component = await nfcApi.component(databaseId.toInt());
      if (context.mounted) context.go('/passport', extra: component);
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(nfcApi.errorMessage(e)), backgroundColor: Colors.red));
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = widget.result.component;
    final passed = widget.result.verified;
    final children = <Widget>[
      Row(children: [
        Icon(passed ? Icons.check_circle : Icons.cancel, color: passed ? good : Colors.red, size: 30),
        const SizedBox(width: 10),
        Expanded(child: Text(passed ? 'AUTHENTIC COMPONENT' : 'VERIFICATION FAILED', style: TextStyle(color: passed ? good : Colors.red, fontSize: 18, fontWeight: FontWeight.w900))),
      ]),
    ];
    if (data != null) {
      children.addAll(_componentContent(data));
    } else if (!passed) {
      children.addAll(_unboundContent());
    }
    if (widget.result.reason != null && widget.result.reason!.trim().isNotEmpty) {
      children.add(const SizedBox(height: 12));
      children.add(Text(widget.result.reason!, style: TextStyle(color: passed ? muted : Colors.red, height: 1.4)));
    }
    if (widget.result.checks.isNotEmpty) {
      children.add(const Divider(height: 26));
      children.addAll(widget.result.checks.entries.map(_checkRow));
    }
    return CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children));
  }

  List<Widget> _componentContent(Map<String, dynamic> data) => [
    const SizedBox(height: 18),
    _section('COMPONENT DETAILS', [
      _detail('Serial Number', data['serial_number']), _detail('Component Type', data['component_type']), _detail('Manufacturer', data['manufacturer']), _detail('Status', data['status']), _detail('Aircraft', data['aircraft']), _detail('Component ID', data['id']), _detail('Last Updated', data['updated_at']),
    ]),
    const SizedBox(height: 12),
    _section('TAG DETAILS', [
      _detail('Identifier', data['tag_identifier']), _detail('Technology', data['tag_technology']), _detail('Security', data['tag_security_type']), _detail('Tamper status', data['tag_tamper_status']), _detail('Registered', data['tag_registered_at']),
    ]),
    const SizedBox(height: 12),
    Row(children: [
      Expanded(child: FilledButton.icon(onPressed: () => _openPassport(context), icon: const Icon(Icons.badge_outlined), label: const Text('Passport'))),
      const SizedBox(width: 10),
      Expanded(child: OutlinedButton.icon(onPressed: editing ? null : _startEdit, icon: const Icon(Icons.edit_outlined), label: const Text('Update data'))),
    ]),
    if (editing) ...[const SizedBox(height: 14), _editPanel()],
    const SizedBox(height: 14),
    _historySection(data['database_id']),
  ];

  List<Widget> _unboundContent() => [
    const SizedBox(height: 12),
    const Text('This NFC tag is not bound to a component yet. The scanned UID is preserved for binding.', style: TextStyle(color: muted, height: 1.45)),
    const SizedBox(height: 12),
    SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: () => _bind(context), icon: const Icon(Icons.link), label: const Text('Bind this scanned NFC tag'))),
  ];

  Widget _checkRow(MapEntry<String, bool> entry) => Padding(
    padding: const EdgeInsets.only(bottom: 9),
    child: Row(children: [
      Icon(entry.value ? Icons.check_circle_outline : Icons.cancel_outlined, color: entry.value ? good : Colors.red, size: 18),
      const SizedBox(width: 8),
      Expanded(child: Text(_label(entry.key), style: const TextStyle(fontWeight: FontWeight.w600))),
    ]),
  );

  String _label(String value) => value.replaceAll('_', ' ').replaceAll(RegExp(r'\s+'), ' ').trim().toUpperCase();

  Widget _section(String title, List<Widget> children) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(title, style: const TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
    const SizedBox(height: 8),
    ...children,
  ]);

  Widget _detail(String label, Object? value) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: Text(label, style: const TextStyle(color: muted, fontSize: 12))),
      const SizedBox(width: 12),
      Expanded(child: Text(value?.toString() ?? '—', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12), textAlign: TextAlign.right)),
    ]),
  );

  Widget _editPanel() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('UPDATE COMPONENT', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
    const SizedBox(height: 10),
    TextField(controller: serial, decoration: const InputDecoration(labelText: 'Serial number')),
    const SizedBox(height: 10),
    TextField(controller: type, decoration: const InputDecoration(labelText: 'Component type')),
    const SizedBox(height: 10),
    TextField(controller: manufacturer, decoration: const InputDecoration(labelText: 'Manufacturer')),
    const SizedBox(height: 10),
    DropdownButtonFormField<String>(value: status, decoration: const InputDecoration(labelText: 'Status'), items: const [
      DropdownMenuItem(value: 'OPERATIONAL', child: Text('Operational')),
      DropdownMenuItem(value: 'MAINTENANCE', child: Text('Maintenance')),
      DropdownMenuItem(value: 'RETIRED', child: Text('Retired')),
      DropdownMenuItem(value: 'SUSPENDED', child: Text('Suspended')),
    ], onChanged: saving ? null : (value) { if (value != null) setState(() => status = value); }),
    const SizedBox(height: 10),
    DropdownButtonFormField<String?>(value: selectedAircraft, decoration: const InputDecoration(labelText: 'Aircraft'), items: [
      const DropdownMenuItem<String?>(value: null, child: Text('Unassigned')),
      ...aircraft.map((item) => DropdownMenuItem<String?>(value: item.id.toString(), child: Text(item.registration))),
    ], onChanged: saving ? null : (value) => setState(() => selectedAircraft = value)),
    const SizedBox(height: 12),
    Row(children: [
      Expanded(child: OutlinedButton(onPressed: saving ? null : () => setState(() => editing = false), child: const Text('Cancel'))),
      const SizedBox(width: 10),
      Expanded(child: FilledButton(onPressed: saving ? null : _saveEdit, child: Text(saving ? 'Saving…' : 'Save update'))),
    ]),
  ]);

  Widget _historySection(Object? rawId) {
    final id = rawId is num ? rawId.toInt() : null;
    if (id == null) return const SizedBox.shrink();
    return ExpansionTile(
      tilePadding: EdgeInsets.zero,
      title: const Text('Update history', style: TextStyle(fontWeight: FontWeight.w800)),
      onExpansionChanged: (open) { if (open && history.isEmpty) _loadHistory(id); },
      children: [
        if (loadingHistory) const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(color: accent)),
        if (!loadingHistory && history.isEmpty) const Padding(padding: EdgeInsets.all(12), child: Align(alignment: Alignment.centerLeft, child: Text('No updates recorded.', style: TextStyle(color: muted)))),
        ...history.map((item) => ListTile(contentPadding: EdgeInsets.zero, title: Text(item.action, style: const TextStyle(fontWeight: FontWeight.w700)), subtitle: Text('${item.actorName ?? 'System'} · ${item.createdAt}', style: const TextStyle(color: muted, fontSize: 11)))),
      ],
    );
  }
}
