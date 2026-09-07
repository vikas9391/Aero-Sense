import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
    setState(() => saving = true);
    try {
      await api.createComponent({
        'aircraft_id': aircraftId == null ? null : int.parse(aircraftId!),
        'component_type': type.text.trim(),
        'serial_number': serial.text.trim(),
        'manufacturer': manufacturer.text.trim(),
        'status': status,
      });
      if (mounted) {
        serial.clear();
        type.clear();
        manufacturer.clear();
        setState(() => aircraftId = null);
        _msg('Component registered successfully.');
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
            decoration: const InputDecoration(labelText: 'Aircraft (optional)'),
            hint: const Text('Unassigned'),
            items: aircraft.map((a) => DropdownMenuItem<String>(value: '${a.id}', child: Text(a.registration, overflow: TextOverflow.ellipsis))).toList(),
            onChanged: (v) => setState(() => aircraftId = v),
          );
    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(title: const Text('Register Component'), backgroundColor: bg),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 110),
        children: [
          const Text('COMPONENT IDENTITY', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
          const SizedBox(height: 4),
          const Text('Register component', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
          const SizedBox(height: 5),
          const Text('Create the persistent digital identity used by the component passport and NFC verification.', style: TextStyle(color: muted, height: 1.4)),
          const SizedBox(height: 18),
          CardBox(
            child: Column(
              children: [
                TextField(controller: serial, decoration: const InputDecoration(labelText: 'Serial Number *')),
                const SizedBox(height: 12),
                TextField(controller: type, decoration: const InputDecoration(labelText: 'Component Type *')),
                const SizedBox(height: 12),
                TextField(controller: manufacturer, decoration: const InputDecoration(labelText: 'Manufacturer *')),
                const SizedBox(height: 12),
                aircraftField,
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  isExpanded: true,
                  initialValue: status,
                  decoration: const InputDecoration(labelText: 'Status'),
                  items: const [
                    DropdownMenuItem(value: 'OPERATIONAL', child: Text('OPERATIONAL')),
                    DropdownMenuItem(value: 'MAINTENANCE', child: Text('MAINTENANCE')),
                    DropdownMenuItem(value: 'RETIRED', child: Text('RETIRED')),
                  ],
                  onChanged: (v) => setState(() => status = v ?? status),
                ),
                const SizedBox(height: 18),
                SizedBox(width: double.infinity, height: 52, child: FilledButton.icon(onPressed: saving ? null : save, icon: const Icon(Icons.add_box_outlined), label: Text(saving ? 'Registering…' : 'Register Component'))),
              ],
            ),
          ),
        ],
      ),
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

  @override
  void initState() {
    super.initState();
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
    if (await NfcManager.instance.checkAvailability() == NfcAvailability.enabled) return true;
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
    setState(() { scanning = true; identifier.clear(); });
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
      _msg('Select a component and provide an identifier.', true);
      return;
    }
    setState(() => saving = true);
    try {
      await api.dio.post('/tags/register', data: {
        'component_id': int.parse(componentId!),
        'technology': technology,
        'identifier': identifier.text.trim(),
        'security_type': security,
      });
      if (mounted) {
        identifier.clear();
        _msg('Tag registered successfully.');
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
    final componentField = loading
        ? const LinearProgressIndicator(color: accent)
        : DropdownButtonFormField<String>(
            isExpanded: true,
            initialValue: componentId,
            decoration: const InputDecoration(labelText: 'Component *'),
            items: components.map((c) => DropdownMenuItem<String>(value: '${c.id}', child: Text('${c.serial} · ${c.type}', overflow: TextOverflow.ellipsis))).toList(),
            onChanged: (v) => setState(() => componentId = v),
          );
    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(title: const Text('Register NFC Tag'), backgroundColor: bg),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 110),
        children: [
          const Text('SECURE TAG BINDING', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
          const SizedBox(height: 4),
          const Text('Register tag', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
          const SizedBox(height: 5),
          const Text('Bind a physical NFC/RFID identifier to an existing component.', style: TextStyle(color: muted, height: 1.4)),
          const SizedBox(height: 18),
          CardBox(
            child: Column(
              children: [
                componentField,
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  isExpanded: true,
                  initialValue: technology,
                  decoration: const InputDecoration(labelText: 'Technology'),
                  items: const [
                    DropdownMenuItem(value: 'NFC', child: Text('NFC')),
                    DropdownMenuItem(value: 'UHF_RFID', child: Text('UHF RFID')),
                  ],
                  onChanged: (v) => setState(() => technology = v ?? technology),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: identifier,
                  decoration: InputDecoration(
                    labelText: 'Identifier *',
                    hintText: '04:AB:12:...',
                    suffixIcon: IconButton(onPressed: scanning ? null : readNfc, icon: Icon(scanning ? Icons.sync : Icons.nfc)),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  isExpanded: true,
                  initialValue: security,
                  decoration: const InputDecoration(labelText: 'Security Type'),
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
                    final read = OutlinedButton.icon(onPressed: scanning ? null : readNfc, icon: const Icon(Icons.nfc), label: Text(scanning ? 'Reading…' : 'Read NFC'));
                    final bind = FilledButton.icon(onPressed: saving ? null : save, icon: const Icon(Icons.link), label: Text(saving ? 'Saving…' : 'Bind Tag'));
                    if (compact) {
                      return Column(children: [SizedBox(width: double.infinity, child: read), const SizedBox(height: 10), SizedBox(width: double.infinity, child: bind)]);
                    }
                    return Row(children: [Expanded(child: read), const SizedBox(width: 10), Expanded(child: bind)]);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
