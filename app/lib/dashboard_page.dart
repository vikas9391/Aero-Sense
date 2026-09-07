import 'package:flutter/material.dart';

import 'core/api.dart';
import 'nfc_pages.dart';
import 'security_audit.dart';
import 'theme.dart';
import 'widgets.dart';

class MobileDashboardScreen extends StatefulWidget {
  final String role;

  const MobileDashboardScreen({required this.role, super.key});

  bool get canVerify => role == 'COMPANY_ADMIN' || role == 'MANUFACTURER' || role == 'MAINTENANCE_TECHNICIAN' || role == 'INSPECTOR';
  bool get canAudit => role == 'COMPANY_ADMIN' || role == 'INSPECTOR';

  @override
  State<MobileDashboardScreen> createState() => _MobileDashboardScreenState();
}

class _MobileDashboardScreenState extends State<MobileDashboardScreen> {
  final api = Api();
  List<Aircraft> aircraft = [];
  List<Component> components = [];
  List<VerificationLog> verifications = [];
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      aircraft = await api.aircraft();
      components = await api.components();
      if (widget.canVerify) {
        try {
          verifications = await api.verificationLogs();
        } catch (_) {
          verifications = [];
        }
      } else {
        verifications = [];
      }
    } catch (e) {
      error = api.errorMessage(e);
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final verified = components.where((c) => c.status.toUpperCase() == 'OPERATIONAL').length;
    final tampered = components.where((c) => c.status.toUpperCase() == 'TAMPERED').length;
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        children: [
          const Text('OPERATIONS', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
          const SizedBox(height: 5),
          const Text('Security & Maintenance Dashboard', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          const Text('Fleet and component intelligence at a glance.', style: TextStyle(color: muted, height: 1.4)),
          if (error != null) ...[
            const SizedBox(height: 14),
            CardBox(child: Text(error!, style: const TextStyle(color: Colors.red))),
          ],
          const SizedBox(height: 18),
          if (widget.canVerify)
            CardBox(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.nfc_outlined, color: accent, size: 30),
                  const SizedBox(height: 12),
                  const Text('VERIFICATION CONTROL', style: TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
                  const SizedBox(height: 6),
                  const Text('Verify an aircraft component', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 7),
                  const Text('Scan a registered physical NFC tag and validate its component identity.', style: TextStyle(color: muted, height: 1.4)),
                  const SizedBox(height: 15),
                  SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NfcVerificationScreen())), icon: const Icon(Icons.nfc), label: const Text('Start NFC verification'))),
                ],
              ),
            ),
          if (widget.canVerify) const SizedBox(height: 20),
          const Text('Live overview', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          if (loading)
            const LinearProgressIndicator(color: accent)
          else
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _stat('Aircraft', aircraft.length, Icons.flight_outlined),
                _stat('Components', components.length, Icons.memory_outlined),
                _stat('Operational', verified, Icons.verified_outlined),
                _stat('Security Alerts', tampered, Icons.warning_amber_outlined),
              ],
            ),
          const SizedBox(height: 14),
          CardBox(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('REGISTERED AIRCRAFT', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
                const SizedBox(height: 10),
                if (!loading && aircraft.isEmpty) const Text('No aircraft registered yet.', style: TextStyle(color: muted)),
                ...aircraft.take(5).map((a) => ListTile(contentPadding: EdgeInsets.zero, leading: const Icon(Icons.flight_outlined, color: accent), title: Text(a.registration, style: const TextStyle(fontWeight: FontWeight.w800)), subtitle: Text('${a.model} · ${a.manufacturer}', style: const TextStyle(color: muted)), trailing: StatusPill(a.status))),
              ],
            ),
          ),
          if (widget.canVerify) ...[
            const SizedBox(height: 12),
            CardBox(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [const Expanded(child: Text('Recent NFC Verification Logs', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800))), if (widget.canAudit) IconButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SecurityAuditScreen())), icon: const Icon(Icons.arrow_forward))]),
                  const SizedBox(height: 6),
                  if (verifications.isEmpty) const Text('No verification scans recorded yet.', style: TextStyle(color: muted))
                  else ...verifications.take(5).map((v) => EventRow(title: v.status, subtitle: '${v.createdAt}${v.reason.isEmpty ? '' : ' · ${v.reason}'}', ok: v.status == 'AUTHENTIC' || v.status == 'PASSED')),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _stat(String label, int value, IconData icon) {
    return SizedBox(
      width: MediaQuery.sizeOf(context).width / 2 - 25,
      height: 105,
      child: CardBox(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: accent),
            Text('$value', style: const TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
            Text(label, style: const TextStyle(color: muted)),
          ],
        ),
      ),
    );
  }
}
