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
  @override void initState() { super.initState(); nfcApi.me().then((value) { if (mounted) setState(() => user = value); }).catchError((_) {}); }
  bool get canBind { final role = (user?.role ?? '').toUpperCase(); return role == 'COMPANY_ADMIN' || role == 'MANUFACTURER'; }
  @override Widget build(BuildContext context) => ListView(padding: const EdgeInsets.fromLTRB(20, 18, 20, 110), children: [
    const Text('NFC & COMPONENT IDENTITY', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
    const SizedBox(height: 5), const Text('NFC Center', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
    const SizedBox(height: 6), const Text('Register a physical tag, bind it to a component, or verify an existing tag.', style: TextStyle(color: muted, height: 1.45)),
    const SizedBox(height: 20),
    _ActionCard(icon: Icons.verified_user_outlined, title: 'Verify existing tag', description: 'Read the NFC UID and immediately see the registered component and tag details.', button: 'Start verification', onTap: () => context.go('/verify'), primary: true),
    if (canBind) ...[
      const SizedBox(height: 12),
      _ActionCard(icon: Icons.add_box_outlined, title: 'Register component', description: 'Create the component identity before attaching a physical NFC tag.', button: 'Register component', onTap: () => context.go('/register-component')),
      const SizedBox(height: 12),
      _ActionCard(icon: Icons.link, title: 'Bind NFC tag', description: 'Attach a physical NFC tag to an existing aircraft component.', button: 'Bind tag', onTap: () => context.go('/register-tag')),
    ],
  ]);
}

class _ActionCard extends StatelessWidget {
  final IconData icon; final String title; final String description; final String button; final VoidCallback onTap; final bool primary;
  const _ActionCard({required this.icon, required this.title, required this.description, required this.button, required this.onTap, this.primary = false});
  @override Widget build(BuildContext context) => CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Icon(icon, size: 30, color: primary ? accent : muted), const SizedBox(height: 12),
    Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)), const SizedBox(height: 6),
    Text(description, style: const TextStyle(color: muted, height: 1.4)), const SizedBox(height: 14),
    SizedBox(width: double.infinity, child: primary ? FilledButton.icon(onPressed: onTap, icon: Icon(icon), label: Text(button)) : OutlinedButton.icon(onPressed: onTap, icon: Icon(icon), label: Text(button))),
  ]));
}

class NfcVerificationScreen extends StatefulWidget {
  const NfcVerificationScreen({super.key});
  @override State<NfcVerificationScreen> createState() => _NfcVerificationState();
}

class _NfcVerificationState extends State<NfcVerificationScreen> {
  static const _settings = MethodChannel('aero_sense/settings');
  bool scanning = false; String? uid; String? error; VerificationResponse? result;
  Future<void> _openNfcSettings() async { try { await _settings.invokeMethod('openNfcSettings'); } catch (_) {} }
  Future<void> _scan() async {
    setState(() { scanning = true; uid = null; error = null; result = null; });
    try {
      final availability = await NfcManager.instance.checkAvailability();
      if (availability != NfcAvailability.enabled) {
        if (!mounted) return;
        setState(() { error = availability == NfcAvailability.disabled ? 'NFC is disabled on this phone.' : 'NFC is not available on this phone.'; scanning = false; });
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
          if (mounted) setState(() => uid = identifier);
          try {
            final verification = await nfcApi.verifyNfc(identifier);
            if (mounted) setState(() { result = verification; scanning = false; });
          } catch (e) {
            if (mounted) setState(() { error = nfcApi.errorMessage(e); scanning = false; });
          } finally { await NfcManager.instance.stopSession(); }
        },
      );
    } catch (e) {
      if (mounted) setState(() { error = nfcApi.errorMessage(e); scanning = false; });
      try { await NfcManager.instance.stopSession(); } catch (_) {}
    }
  }
  String? _identifier(NfcTag tag) {
    final android = NfcTagAndroid.from(tag); final bytes = android?.id;
    if (bytes == null || bytes.isEmpty) return null;
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
  }
  void _bindScannedTag() { final value = uid; if (value == null || value.isEmpty) return; context.go('/register-tag?uid=${Uri.encodeComponent(value)}'); }
  @override Widget build(BuildContext context) => ListView(padding: const EdgeInsets.fromLTRB(20, 18, 20, 110), children: [
    const Text('NFC VERIFICATION', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
    const SizedBox(height: 5), const Text('Verify component identity', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
    const SizedBox(height: 6), const Text('Scan a registered tag to retrieve its component identity and update it with an auditable timestamp.', style: TextStyle(color: muted, height: 1.45)),
    const SizedBox(height: 18), CardBox(child: Column(children: [
      Icon(scanning ? Icons.contactless : Icons.nfc, size: 56, color: scanning ? accent : muted), const SizedBox(height: 8),
      Text(scanning ? 'Waiting for a tag…' : 'Tap Start Scan when the tag is ready.', style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
      if (uid != null) ...[const SizedBox(height: 8), Text('UID: $uid', style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w700))],
      const SizedBox(height: 14), SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: scanning ? null : _scan, icon: Icon(scanning ? Icons.hourglass_top : Icons.nfc), label: Text(scanning ? 'Scanning…' : 'Start Scan'))),
      const SizedBox(height: 8), TextButton.icon(onPressed: scanning ? null : _openNfcSettings, icon: const Icon(Icons.settings_outlined), label: const Text('Open NFC Settings')),
    ])),
    if (error != null) ...[
      const SizedBox(height: 12), CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [Icon(Icons.error_outline, color: Colors.red), SizedBox(width: 10), Expanded(child: Text('NFC verification could not be completed.', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700)))]),
        const SizedBox(height: 6), Builder(builder: (_) => Text(error!, style: const TextStyle(color: Colors.red, height: 1.4))),
        if (uid != null) ...[const SizedBox(height: 12), SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: _bindScannedTag, icon: const Icon(Icons.link), label: const Text('Register / bind this scanned tag')))],
      ])),
    ],
    if (result != null) ...[const SizedBox(height: 12), VerificationResultCard(result: result!, scannedUid: uid)],
  ]);
}

class VerificationResultCard extends StatefulWidget {
  final VerificationResponse result; final String? scannedUid;
  const VerificationResultCard({required this.result, this.scannedUid, super.key});
  @override State<VerificationResultCard> createState() => _VerificationResultCardState();
}

class _VerificationResultCardState extends State<VerificationResultCard> {
  bool editing = false, loadingHistory = false, saving = false;
  List<ComponentUpdateHistory> history = []; List<Aircraft> aircraft = []; String? selectedAircraft;
  late final TextEditingController serial = TextEditingController(text: widget.result.component?['serial_number']?.toString() ?? '');
  late final TextEditingController type = TextEditingController(text: widget.result.component?['component_type']?.toString() ?? '');
  late final TextEditingController manufacturer = TextEditingController(text: widget.result.component?['manufacturer']?.toString() ?? '');
  late String status = widget.result.component?['status']?.toString() ?? 'OPERATIONAL';
  @override void dispose() { serial.dispose(); type.dispose(); manufacturer.dispose(); super.dispose(); }
  Future<void> _loadHistory(int id) async {
    if (mounted) setState(() => loadingHistory = true);
    try { final loaded = await nfcApi.componentUpdateHistory(id); if (mounted) setState(() => history = loaded); }
    catch (_) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Unable to load update history.'))); }
    finally { if (mounted) setState(() => loadingHistory = false); }
  }
  Future<void> _startEdit() async {
    final data = widget.result.component; final id = data?['database_id']; if (id is! num) return;
    setState(() { editing = true; selectedAircraft = data?['aircraft_id']?.toString(); });
    try { final loaded = await nfcApi.aircraft(); if (mounted) setState(() => aircraft = loaded); }
    catch (_) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Aircraft list could not be loaded.'))); }
  }
  Future<void> _saveEdit() async {
    final id = widget.result.component?['database_id']; if (id is! num) return;
    if (serial.text.trim().isEmpty || type.text.trim().isEmpty || manufacturer.text.trim().isEmpty) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Serial number, component type and manufacturer are required.'))); return; }
    setState(() => saving = true);
    try {
      final updated = await nfcApi.updateComponent(id.toInt(), {'aircraft_id': selectedAircraft == null ? null : int.tryParse(selectedAircraft!), 'serial_number': serial.text.trim(), 'component_type': type.text.trim(), 'manufacturer': manufacturer.text.trim(), 'status': status});
      widget.result.component?.addAll({'serial_number': updated.serial, 'component_type': updated.type, 'manufacturer': updated.manufacturer, 'status': updated.status, 'aircraft': updated.aircraftRegistration ?? 'Unassigned', 'aircraft_id': updated.aircraftId, 'updated_at': updated.updatedAt});
      setState(() => editing = false);
      await _loadHistory(id.toInt());
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Component updated and timestamped successfully.')));
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(nfcApi.errorMessage(e)), backgroundColor: Colors.red)); }
    finally { if (mounted) setState(() => saving = false); }
  }
  void _bind(BuildContext context) { final value = widget.scannedUid; if (value == null || value.isEmpty) return; context.go('/register-tag?uid=${Uri.encodeComponent(value)}'); }
  Future<void> _openPassport(BuildContext context) async {
    final databaseId = widget.result.component?['database_id']; if (databaseId is! num) return;
    try { final component = await nfcApi.component(databaseId.toInt()); if (context.mounted) context.go('/passport', extra: component); }
    catch (e) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(nfcApi.errorMessage(e)), backgroundColor: Colors.red)); }
  }
  @override Widget build(BuildContext context) {
    final result = widget.result, data = result.component, passed = result.verified;
    return CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [Icon(passed ? Icons.check_circle : Icons.cancel, color: passed ? good : Colors.red, size: 30), const SizedBox(width: 10), Expanded(child: Text(passed ? 'AUTHENTIC COMPONENT' : 'VERIFICATION FAILED', style: TextStyle(color: passed ? good : Colors.red, fontSize: 18, fontWeight: FontWeight.w900)))]),
      if (data != null) ...[
        const SizedBox(height: 18),
        _section('COMPONENT DETAILS', [_detail('Serial Number', data['serial_number']), _detail('Component Type', data['component_type']), _detail('Manufacturer', data['manufacturer']), _detail('Status', data['status']), _detail('Aircraft', data['aircraft']), _detail('Component ID', data['id']), _detail('Last Updated', data['updated_at'])]),
        const SizedBox(height: 12), _section('NFC TAG DETAILS', [_detail('Identifier', data['tag_identifier']), _detail('Technology', data['tag_technology']), _detail('Security', data['tag_security_type']), _detail('Tamper status', data['tag_tamper_status']), _detail('Registered', data['tag_registered_at'])]),
        const SizedBox(height: 12), Row(children: [Expanded(child: FilledButton.icon(onPressed: () => _openPassport(context), icon: const Icon(Icons.badge_outlined), label: const Text('Passport'))), const SizedBox(width: 10), Expanded(child: OutlinedButton.icon(onPressed: editing ? null : _startEdit, icon: const Icon(Icons.edit_outlined), label: const Text('Update data')))]),
        if (editing) ...[const SizedBox(height: 14), _editPanel()],
        const SizedBox(height: 14), _historySection(data['database_id']),
      ] else if (!passed) ...[
        const SizedBox(height: 12), const Text('This NFC tag is not bound to a component yet. The scanned UID is preserved for binding.', style: TextStyle(color: muted, height: 1.45)), const SizedBox(height: 12), SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: () => _bind(context), icon: const Icon(Icons.link), label: const Text('Bind this scanned NFC tag')),
      ],
      if (result.reason != null && result.reason!.trim().isNotEmpty) ...[const SizedBox(height: 12), Text(result.reason!, style: TextStyle(color: passed ? muted : Colors.red, height: 1.4))],
      if (result.checks.isNotEmpty) ...[const Divider(height: 26), for (final entry in result.checks.entries) Padding(padding: const EdgeInsets.only(bottom: 9), child: Row(children: [Icon(entry.value ? Icons.check_circle_outline : Icons.cancel_outlined, color: entry.value ? good : Colors.red, size: 18), const SizedBox(width: 8), Expanded(child: Text(_label(entry.key), style: const TextStyle(fontWeight: FontWeight.w600))), Text(entry.value ? 'PASS' : 'FAIL', style: TextStyle(fontWeight: FontWeight.w900, color: entry.value ? good : Colors.red))]))],
    ]));
  }
  Widget _editPanel() => Container(width: double.infinity, padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(16)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('UPDATE COMPONENT', style: TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.1)), const SizedBox(height: 10),
    TextField(controller: serial, textCapitalization: TextCapitalization.characters, decoration: const InputDecoration(labelText: 'Serial Number', prefixIcon: Icon(Icons.confirmation_number_outlined))), const SizedBox(height: 10),
    TextField(controller: type, decoration: const InputDecoration(labelText: 'Component Type', prefixIcon: Icon(Icons.category_outlined))), const SizedBox(height: 10),
    TextField(controller: manufacturer, decoration: const InputDecoration(labelText: 'Manufacturer', prefixIcon: Icon(Icons.factory_outlined))), const SizedBox(height: 10),
    DropdownButtonFormField<String>(isExpanded: true, initialValue: aircraft.any((a) => '${a.id}' == selectedAircraft) ? selectedAircraft : null, decoration: const InputDecoration(labelText: 'Aircraft', prefixIcon: Icon(Icons.flight_outlined)), hint: const Text('Unassigned'), items: aircraft.map((a) => DropdownMenuItem(value: '${a.id}', child: Text('${a.registration} · ${a.model}', overflow: TextOverflow.ellipsis))).toList(), onChanged: (v) => setState(() => selectedAircraft = v)), const SizedBox(height: 10),
    DropdownButtonFormField<String>(isExpanded: true, initialValue: status, decoration: const InputDecoration(labelText: 'Status', prefixIcon: Icon(Icons.health_and_safety_outlined)), items: const [DropdownMenuItem(value: 'OPERATIONAL', child: Text('Operational')), DropdownMenuItem(value: 'MAINTENANCE', child: Text('Maintenance')), DropdownMenuItem(value: 'RETIRED', child: Text('Retired'))], onChanged: (v) => setState(() => status = v ?? status)), const SizedBox(height: 12),
    const Text('Every save records the previous and new values, server timestamp, and authenticated user.', style: TextStyle(color: muted, fontSize: 12, height: 1.35)), const SizedBox(height: 12),
    Row(children: [Expanded(child: TextButton(onPressed: saving ? null : () => setState(() => editing = false), child: const Text('Cancel'))), const SizedBox(width: 8), Expanded(child: FilledButton.icon(onPressed: saving ? null : _saveEdit, icon: const Icon(Icons.save_outlined), label: Text(saving ? 'Saving…' : 'Save update')))]),
  ]);
  Widget _historySection(Object? rawId) {
    final id = rawId is num ? rawId.toInt() : null;
    return Container(decoration: BoxDecoration(border: Border.all(color: Theme.of(context).dividerColor), borderRadius: BorderRadius.circular(16)), child: ExpansionTile(leading: const Icon(Icons.history), title: const Text('Update history', style: TextStyle(fontWeight: FontWeight.w800)), subtitle: Text(history.isEmpty ? 'View before-and-after changes' : '${history.length} recorded update${history.length == 1 ? '' : 's'}'), onExpansionChanged: (open) { if (open && id != null && history.isEmpty) _loadHistory(id); }, children: [
      if (loadingHistory) const Padding(padding: EdgeInsets.all(20), child: Center(child: CircularProgressIndicator())),
      if (!loadingHistory && history.isEmpty) const Padding(padding: EdgeInsets.fromLTRB(16, 0, 16, 16), child: Align(alignment: Alignment.centerLeft, child: Text('No component updates have been recorded yet.', style: TextStyle(color: muted)))),
      for (final item in history) _historyItem(item),
    ]));
  }
  Widget _historyItem(ComponentUpdateHistory item) {
    final changes = <String>[];
    void addChange(String label, Object? oldValue, Object? newValue) { final oldText = oldValue?.toString() ?? 'Unassigned'; final newText = newValue?.toString() ?? 'Unassigned'; if (oldText != newText) changes.add('$label: $oldText → $newText'); }
    addChange('Serial', item.previousSerial, item.serial); addChange('Type', item.previousType, item.type); addChange('Manufacturer', item.previousManufacturer, item.manufacturer); addChange('Status', item.previousStatus, item.status); addChange('Aircraft ID', item.previousAircraftId, item.aircraftId);
    return Container(width: double.infinity, margin: const EdgeInsets.fromLTRB(12, 0, 12, 10), padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(14)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [const Icon(Icons.history_toggle_off, size: 19, color: accent), const SizedBox(width: 8), Expanded(child: Text('${item.serial} · ${item.type}', style: const TextStyle(fontWeight: FontWeight.w800))), Text(item.updatedAt, style: const TextStyle(color: muted, fontSize: 11))]),
      const SizedBox(height: 6),
      Text(item.userName?.trim().isNotEmpty == true ? 'Updated by ${item.userName}' : 'Updated by user #${item.userId}', style: const TextStyle(color: muted, fontSize: 12)),
      const SizedBox(height: 10),
      if (changes.isEmpty) const Text('No field-level differences detected.', style: TextStyle(color: muted, fontSize: 12)) else ...[const Text('CHANGES', style: TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)), const SizedBox(height: 6), for (final change in changes) Padding(padding: const EdgeInsets.only(bottom: 5), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('• ', style: TextStyle(color: accent, fontWeight: FontWeight.w900)), Expanded(child: Text(change, style: const TextStyle(fontSize: 12, height: 1.35)))]))],
    ]));
  }
  Widget _section(String title, List<Widget> rows) => Container(width: double.infinity, padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(16)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.1)), const SizedBox(height: 10), ...rows]));
  Widget _detail(String label, Object? value) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [SizedBox(width: 112, child: Text(label, style: const TextStyle(color: muted, fontSize: 12))), const SizedBox(width: 8), Expanded(child: Text('${value ?? '—'}', style: const TextStyle(fontWeight: FontWeight.w700, height: 1.3)))]));
  String _label(String value) { final text = value.replaceAll('_', ' '); return text.isEmpty ? text : text[0].toUpperCase() + text.substring(1); }
}
