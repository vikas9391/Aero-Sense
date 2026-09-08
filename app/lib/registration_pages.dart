import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:nfc_manager/nfc_manager_android.dart';

import 'core/api.dart';
import 'theme.dart';
import 'widgets.dart';

final api = Api();

class RegisterComponentScreen extends StatefulWidget {
  const RegisterComponentScreen({super.key});
  @override
  State<RegisterComponentScreen> createState() => _RegisterComponentState();
}

class _RegisterComponentState extends State<RegisterComponentScreen> {
  final serial = TextEditingController();
  final type = TextEditingController();
  final manufacturer = TextEditingController();
  List<Aircraft> aircraft = [];
  String? aircraftId;
  String status = 'OPERATIONAL';
  bool loading = true;
  bool saving = false;
  Component? createdComponent;

  @override
  void initState() {
    super.initState();
    api.aircraft().then((v) {
      if (mounted) setState(() { aircraft = v; loading = false; });
    }).catchError((_) {
      if (mounted) setState(() => loading = false);
    });
  }

  @override
  void dispose() {
    serial.dispose();
    type.dispose();
    manufacturer.dispose();
    super.dispose();
  }

  Future<void> save() async {
    if (serial.text.trim().isEmpty || type.text.trim().isEmpty || manufacturer.text.trim().isEmpty) {
      _msg('Complete all required fields.', true);
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() { saving = true; createdComponent = null; });
    try {
      final component = await api.createComponent({
        'aircraft_id': aircraftId == null ? null : int.parse(aircraftId!),
        'component_type': type.text.trim(),
        'serial_number': serial.text.trim(),
        'manufacturer': manufacturer.text.trim(),
        'status': status,
      });
      if (mounted) {
        setState(() => createdComponent = component);
        serial.clear();
        type.clear();
        manufacturer.clear();
        aircraftId = null;
        status = 'OPERATIONAL';
      }
    } catch (e) {
      if (mounted) _msg(api.errorMessage(e), true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  void _msg(String text, [bool error = false]) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text), backgroundColor: error ? Colors.red : null));
  }

  @override
  Widget build(BuildContext context) {
    final aircraftField = loading
        ? const LinearProgressIndicator(color: accent)
        : DropdownButtonFormField<String>(
            isExpanded: true,
            initialValue: aircraftId,
            decoration: const InputDecoration(labelText: 'Aircraft (optional)', prefixIcon: Icon(Icons.flight_outlined)),
            hint: const Text('Unassigned'),
            items: aircraft.map((a) => DropdownMenuItem<String>(value: '${a.id}', child: Text('${a.registration} · ${a.model}', overflow: TextOverflow.ellipsis))).toList(),
            onChanged: (v) => setState(() => aircraftId = v),
          );

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
      children: [
        const Text('COMPONENT IDENTITY', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
        const SizedBox(height: 4),
        const Text('Register component', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
        const SizedBox(height: 5),
        const Text('Create the persistent digital identity used by the component passport and NFC verification.', style: TextStyle(color: muted, height: 1.4)),
        const SizedBox(height: 18),
        if (createdComponent != null) ...[
          CardBox(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Row(children: [Icon(Icons.check_circle, color: good), SizedBox(width: 10), Expanded(child: Text('Component registered', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)))]),
              const SizedBox(height: 10),
              Text('${createdComponent!.serial} · ${createdComponent!.type}', style: const TextStyle(fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text('${createdComponent!.manufacturer} · ${createdComponent!.status}', style: const TextStyle(color: muted)),
              const SizedBox(height: 14),
              SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: () => context.go('/register-tag?component=${createdComponent!.id}'), icon: const Icon(Icons.link), label: const Text('Bind NFC tag now'))),
              const SizedBox(height: 8),
              SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: () => context.go('/passport', extra: createdComponent), icon: const Icon(Icons.badge_outlined), label: const Text('Open component passport'))),
            ]),
          ),
          const SizedBox(height: 12),
        ],
        CardBox(
          child: Column(
            children: [
              TextField(controller: serial, textCapitalization: TextCapitalization.characters, decoration: const InputDecoration(labelText: 'Serial Number *', prefixIcon: Icon(Icons.confirmation_number_outlined))),
              const SizedBox(height: 12),
              TextField(controller: type, decoration: const InputDecoration(labelText: 'Component Type *', prefixIcon: Icon(Icons.category_outlined))),
              const SizedBox(height: 12),
              TextField(controller: manufacturer, decoration: const InputDecoration(labelText: 'Manufacturer *', prefixIcon: Icon(Icons.factory_outlined))),
              const SizedBox(height: 12),
              aircraftField,
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                isExpanded: true,
                initialValue: status,
                decoration: const InputDecoration(labelText: 'Status', prefixIcon: Icon(Icons.health_and_safety_outlined)),
                items: const [
                  DropdownMenuItem(value: 'OPERATIONAL', child: Text('Operational')),
                  DropdownMenuItem(value: 'MAINTENANCE', child: Text('Maintenance')),
                  DropdownMenuItem(value: 'RETIRED', child: Text('Retired')),
                ],
                onChanged: (v) => setState(() => status = v ?? status),
              ),
              const SizedBox(height: 18),
              SizedBox(width: double.infinity, height: 52, child: FilledButton.icon(onPressed: saving ? null : save, icon: const Icon(Icons.add_box_outlined), label: Text(saving ? 'Registering…' : 'Register Component'))),
            ],
          ),
        ),
      ],
    );
  }
}

class RegisterTagScreen extends StatefulWidget {
  const RegisterTagScreen({super.key});
  @override
  State<RegisterTagScreen> createState() => _RegisterTagState();
}

class _RegisterTagState extends State<RegisterTagScreen> {
  static const _settingsChannel = MethodChannel('aero_sense/settings');
  List<Component> components = [];
  String? componentId;
  String technology = 'NFC';
  String security = 'TAMPER_PROOF';
  final identifier = TextEditingController();
  bool loading = true;
  bool scanning = false;
  bool saving = false;
  Component? boundComponent;
  String? boundIdentifier;

  @override
  void initState() {
    super.initState();
    final uri = GoRouterState.of(context).uri;
    final initialUid = uri.queryParameters['uid'];
    final initialComponent = uri.queryParameters['component'];
    if (initialUid != null && initialUid.trim().isNotEmpty) identifier.text = initialUid.trim().toUpperCase();
    if (initialComponent != null && int.tryParse(initialComponent) != null) componentId = initialComponent;
    api.components().then((v) {
      if (mounted) setState(() { components = v; loading = false; });
    }).catchError((_) {
      if (mounted) setState(() => loading = false);
    });
  }

  @override
  void dispose() {
    identifier.dispose();
    super.dispose();
  }

  Future<bool> _ensureNfcReady() async {
    final availability = await NfcManager.instance.checkAvailability();
    if (availability == Availability.enabled) return true;
    if (!mounted) return false;
    final open = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('NFC is required'),
        content: const Text('Enable NFC in Android Settings before reading the physical tag identifier.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Open NFC Settings')),
        ],
      ),
    );
    if (open != true) return false;
    try {
      await _settingsChannel.invokeMethod<void>('openNfcSettings');
    } catch (_) {
      if (mounted) _msg('Unable to open NFC settings. Enable NFC manually in Android Settings.', true);
    }
    return false;
  }

  Future<void> readNfc() async {
    if (scanning) return;
    FocusScope.of(context).unfocus();
    setState(() { scanning = true; boundComponent = null; boundIdentifier = null; });
    try {
      if (!await _ensureNfcReady()) {
        if (mounted) setState(() => scanning = false);
        return;
      }
      await NfcManager.instance.startSession(
        pollingOptions: {NfcPollingOption.iso14443, NfcPollingOption.iso15693, NfcPollingOption.iso18092},
        onDiscovered: (tag) async {
          try {
            final t = NfcTagAndroid.from(tag);
            if (t == null || t.id.isEmpty) throw Exception('Unable to read NFC tag identifier.');
            final value = t.id.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
            if (mounted) setState(() => identifier.text = value);
          } catch (e) {
            if (mounted) _msg(api.errorMessage(e), true);
          } finally {
            await NfcManager.instance.stopSession();
            if (mounted) setState(() => scanning = false);
          }
        },
      );
    } catch (e) {
      if (mounted) {
        setState(() => scanning = false);
        _msg(api.errorMessage(e), true);
      }
    }
  }

  Future<void> save() async {
    if (componentId == null || identifier.text.trim().isEmpty) {
      _msg('Select a component and scan or enter an identifier.', true);
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() => saving = true);
    try {
      await api.dio.post('/tags/register', data: {
        'component_id': int.parse(componentId!),
        'technology': technology,
        'identifier': identifier.text.trim().toUpperCase(),
        'security_type': security,
      });
      final selected = components.where((c) => c.id == int.parse(componentId!)).firstOrNull;
      if (mounted) {
        setState(() {
          boundComponent = selected;
          boundIdentifier = identifier.text.trim().toUpperCase();
          saving = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => saving = false);
        _msg(api.errorMessage(e), true);
      }
    }
  }

  void _msg(String text, [bool error = false]) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text), backgroundColor: error ? Colors.red : null));
  }

  @override
  Widget build(BuildContext context) {
    final componentField = loading
        ? const LinearProgressIndicator(color: accent)
        : DropdownButtonFormField<String>(
            isExpanded: true,
            initialValue: componentId,
            decoration: const InputDecoration(labelText: 'Component *', prefixIcon: Icon(Icons.memory_outlined)),
            hint: const Text('Choose component'),
            items: components.map((c) => DropdownMenuItem<String>(value: '${c.id}', child: Text('${c.serial} · ${c.type}', overflow: TextOverflow.ellipsis))).toList(),
            onChanged: (v) => setState(() { componentId = v; boundComponent = null; }),
          );

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
      children: [
        const Text('SECURE TAG BINDING', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
        const SizedBox(height: 4),
        const Text('Bind NFC tag', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
        const SizedBox(height: 5),
        const Text('Select the component, scan its physical NFC UID, review the binding details, then save the link.', style: TextStyle(color: muted, height: 1.4)),
        const SizedBox(height: 18),
        if (boundComponent != null) ...[
          CardBox(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Row(children: [Icon(Icons.link, color: good), SizedBox(width: 10), Expanded(child: Text('NFC tag bound successfully', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)))]),
              const SizedBox(height: 12),
              _bindingRow('Component', '${boundComponent!.serial} · ${boundComponent!.type}'),
              _bindingRow('Manufacturer', boundComponent!.manufacturer),
              _bindingRow('Tag UID', boundIdentifier ?? ''),
              _bindingRow('Technology', technology),
              _bindingRow('Security', security == 'TAMPER_PROOF' ? 'Tamper Proof' : 'Standard'),
              const SizedBox(height: 14),
              SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: () => context.go('/verify'), icon: const Icon(Icons.nfc), label: const Text('Verify this tag now'))),
              const SizedBox(height: 8),
              SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: () => context.go('/passport', extra: boundComponent), icon: const Icon(Icons.badge_outlined), label: const Text('Open component passport'))),
            ]),
          ),
          const SizedBox(height: 12),
        ],
        CardBox(
          child: Column(
            children: [
              componentField,
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                isExpanded: true,
                initialValue: technology,
                decoration: const InputDecoration(labelText: 'Technology', prefixIcon: Icon(Icons.settings_input_antenna_outlined)),
                items: const [
                  DropdownMenuItem(value: 'NFC', child: Text('NFC')),
                  DropdownMenuItem(value: 'UHF_RFID', child: Text('UHF RFID')),
                ],
                onChanged: (v) => setState(() => technology = v ?? technology),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: identifier,
                textCapitalization: TextCapitalization.characters,
                decoration: InputDecoration(
                  labelText: 'Tag UID / Identifier *',
                  hintText: '04:AB:12:...',
                  helperText: 'Best practice: scan the physical tag instead of typing the UID.',
                  prefixIcon: const Icon(Icons.tag_outlined),
                  suffixIcon: IconButton(tooltip: 'Scan NFC', onPressed: scanning ? null : readNfc, icon: Icon(scanning ? Icons.sync : Icons.nfc)),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                isExpanded: true,
                initialValue: security,
                decoration: const InputDecoration(labelText: 'Security Type', prefixIcon: Icon(Icons.shield_outlined)),
                items: const [
                  DropdownMenuItem(value: 'TAMPER_PROOF', child: Text('Tamper Proof')),
                  DropdownMenuItem(value: 'STANDARD', child: Text('Standard')),
                ],
                onChanged: (v) => setState(() => security = v ?? security),
              ),
              const SizedBox(height: 18),
              LayoutBuilder(
                builder: (context, constraints) {
                  final compact = constraints.maxWidth < 430;
                  final read = OutlinedButton.icon(onPressed: scanning ? null : readNfc, icon: const Icon(Icons.nfc), label: Text(scanning ? 'Reading…' : 'Scan physical tag'));
                  final bind = FilledButton.icon(onPressed: saving ? null : save, icon: const Icon(Icons.link), label: Text(saving ? 'Binding…' : 'Bind Tag'));
                  if (compact) return Column(children: [SizedBox(width: double.infinity, child: read), const SizedBox(height: 10), SizedBox(width: double.infinity, child: bind)]);
                  return Row(children: [Expanded(child: read), const SizedBox(width: 10), Expanded(child: bind)]);
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _bindingRow(String label, String value) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 105, child: Text(label, style: const TextStyle(color: muted, fontSize: 12))),
          Expanded(child: Text(value.isEmpty ? '—' : value, style: const TextStyle(fontWeight: FontWeight.w700))),
        ]),
      );
}