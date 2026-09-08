import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:nfc_manager/nfc_manager_android.dart';

import 'core/api.dart';
import 'theme.dart';
import 'widgets.dart';

final api = Api();

// Existing component registration screen remains unchanged.

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
    if (availability == NfcAvailability.enabled) return true;
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

  Future<void> _stopNfcReader() async {
    try {
      await NfcManagerAndroid.instance.disableReaderMode();
    } catch (_) {
      try { await NfcManager.instance.stopSession(); } catch (_) {}
    }
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

      // Android Reader Mode keeps the tag in Aero-Sense instead of allowing
      // Android's normal NFC/NDEF dispatch to open another app.
      if (Theme.of(context).platform == TargetPlatform.android) {
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
          onTagDiscovered: (tag) async {
            try {
              final t = NfcTagAndroid.from(tag);
              if (t == null || t.id.isEmpty) throw Exception('Unable to read NFC tag identifier.');
              final value = t.id.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
              if (mounted) setState(() => identifier.text = value);
            } catch (e) {
              if (mounted) _msg(api.errorMessage(e), true);
            } finally {
              await _stopNfcReader();
              if (mounted) setState(() => scanning = false);
            }
          },
        );
      } else {
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
      }
    } catch (e) {
      if (mounted) {
        setState(() => scanning = false);
        _msg(api.errorMessage(e), true);
      }
      await _stopNfcReader();
    }
  }

  void _msg(String text, [bool error = false]) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text), backgroundColor: error ? Colors.red : null));
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
      if (mounted) setState(() { boundComponent = selected; boundIdentifier = identifier.text.trim().toUpperCase(); saving = false; });
    } catch (e) {
      if (mounted) { setState(() => saving = false); _msg(api.errorMessage(e), true); }
    }
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
        CardBox(child: Column(children: [
          componentField,
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
            initialValue: technology,
            decoration: const InputDecoration(labelText: 'Technology', prefixIcon: Icon(Icons.settings_input_antenna_outlined)),
            items: const [DropdownMenuItem(value: 'NFC', child: Text('NFC')), DropdownMenuItem(value: 'UHF_RFID', child: Text('UHF RFID'))],
            onChanged: (v) => setState(() => technology = v ?? technology),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            isExpanded: true,
            initialValue: security,
            decoration: const InputDecoration(labelText: 'Security Type', prefixIcon: Icon(Icons.shield_outlined)),
            items: const [DropdownMenuItem(value: 'TAMPER_PROOF', child: Text('Tamper Proof')), DropdownMenuItem(value: 'STANDARD', child: Text('Standard'))],
            onChanged: (v) => setState(() => security = v ?? security),
          ),
          const SizedBox(height: 18),
          SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: saving || scanning ? null : save, icon: const Icon(Icons.link), label: Text(saving ? 'Binding…' : 'Bind tag to component'))),
        ])),
      ],
    );
  }
}
