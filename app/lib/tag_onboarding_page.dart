import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'core/api.dart';
import 'theme.dart';
import 'widgets.dart';

final onboardingApi = Api();

class TagOnboardingScreen extends StatefulWidget {
  final String uid;

  const TagOnboardingScreen({required this.uid, super.key});

  @override
  State<TagOnboardingScreen> createState() => _TagOnboardingScreenState();
}

class _TagOnboardingScreenState extends State<TagOnboardingScreen> {
  final serial = TextEditingController();
  final type = TextEditingController();
  final manufacturer = TextEditingController();

  List<Aircraft> aircraft = [];
  String? aircraftId;
  String status = 'OPERATIONAL';
  bool loadingAircraft = true;
  bool saving = false;

  @override
  void initState() {
    super.initState();
    onboardingApi.aircraft().then((value) {
      if (mounted) setState(() { aircraft = value; loadingAircraft = false; });
    }).catchError((_) {
      if (mounted) setState(() => loadingAircraft = false);
    });
  }

  @override
  void dispose() {
    serial.dispose();
    type.dispose();
    manufacturer.dispose();
    super.dispose();
  }

  Future<void> _saveAndBind() async {
    if (serial.text.trim().isEmpty || type.text.trim().isEmpty || manufacturer.text.trim().isEmpty) {
      _message('Serial number, component type and manufacturer are required.', true);
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() => saving = true);
    try {
      final component = await onboardingApi.createComponent({
        'aircraft_id': aircraftId == null ? null : int.tryParse(aircraftId!),
        'component_type': type.text.trim(),
        'serial_number': serial.text.trim(),
        'manufacturer': manufacturer.text.trim(),
        'status': status,
      });

      if (!mounted) return;
      context.go('/register-tag?component=${component.id}&uid=${Uri.encodeComponent(widget.uid)}');
    } catch (e) {
      if (mounted) _message(onboardingApi.errorMessage(e), true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  void _message(String text, [bool error = false]) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(text), backgroundColor: error ? Colors.red : null),
    );
  }

  @override
  Widget build(BuildContext context) {
    final aircraftField = loadingAircraft
        ? const LinearProgressIndicator(color: accent)
        : DropdownButtonFormField<String>(
            isExpanded: true,
            initialValue: aircraftId,
            decoration: const InputDecoration(
              labelText: 'Aircraft (optional)',
              prefixIcon: Icon(Icons.flight_outlined),
            ),
            hint: const Text('Unassigned'),
            items: aircraft.map((a) => DropdownMenuItem<String>(
              value: '${a.id}',
              child: Text('${a.registration} · ${a.model}', overflow: TextOverflow.ellipsis),
            )).toList(),
            onChanged: (value) => setState(() => aircraftId = value),
          );

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
      children: [
        const Text(
          'UNKNOWN NFC TAG',
          style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3),
        ),
        const SizedBox(height: 4),
        const Text('Register component', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
        const SizedBox(height: 5),
        const Text(
          'This tag is not registered yet. Enter the component details and the scanned UID will be carried into the binding step automatically.',
          style: TextStyle(color: muted, height: 1.45),
        ),
        const SizedBox(height: 18),
        CardBox(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [
              Icon(Icons.nfc, color: accent),
              SizedBox(width: 10),
              Expanded(child: Text('Scanned NFC tag', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800))),
            ]),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(12)),
              child: Text(widget.uid, style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w800)),
            ),
          ]),
        ),
        const SizedBox(height: 12),
        CardBox(
          child: Column(children: [
            TextField(
              controller: serial,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: 'Serial Number *',
                prefixIcon: Icon(Icons.confirmation_number_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: type,
              decoration: const InputDecoration(
                labelText: 'Component Type *',
                prefixIcon: Icon(Icons.category_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: manufacturer,
              decoration: const InputDecoration(
                labelText: 'Manufacturer *',
                prefixIcon: Icon(Icons.factory_outlined),
              ),
            ),
            const SizedBox(height: 12),
            aircraftField,
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              isExpanded: true,
              initialValue: status,
              decoration: const InputDecoration(
                labelText: 'Status',
                prefixIcon: Icon(Icons.health_and_safety_outlined),
              ),
              items: const [
                DropdownMenuItem(value: 'OPERATIONAL', child: Text('Operational')),
                DropdownMenuItem(value: 'MAINTENANCE', child: Text('Maintenance')),
                DropdownMenuItem(value: 'RETIRED', child: Text('Retired')),
              ],
              onChanged: (value) => setState(() => status = value ?? status),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton.icon(
                onPressed: saving ? null : _saveAndBind,
                icon: const Icon(Icons.link),
                label: Text(saving ? 'Saving component…' : 'Save & Continue to Binding'),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () => context.go('/register-tag?uid=${Uri.encodeComponent(widget.uid)}'),
          icon: const Icon(Icons.link),
          label: const Text('Bind to an existing component instead'),
        ),
      ],
    );
  }
}
