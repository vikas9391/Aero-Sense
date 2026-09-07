import 'package:flutter/material.dart';

import 'core/api.dart';
import 'theme.dart';
import 'widgets.dart';

final _api = Api();

class SecurityAuditScreen extends StatefulWidget {
  const SecurityAuditScreen({super.key});

  @override
  State<SecurityAuditScreen> createState() => _SecurityAuditScreenState();
}

class _SecurityAuditScreenState extends State<SecurityAuditScreen> {
  List<VerificationLog> logs = [];
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      logs = await _api.verificationLogs();
      error = null;
    } catch (e) {
      error = _api.errorMessage(e);
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        children: [
          const Text('SECURITY & AUDIT', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
          const SizedBox(height: 5),
          const Text('Security & Audit', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          const Text('Review tag-security controls and the verification audit stream.', style: TextStyle(color: muted, height: 1.4)),
          if (error != null) ...[
            const SizedBox(height: 14),
            CardBox(child: Text(error!, style: const TextStyle(color: Colors.red))),
          ],
          const SizedBox(height: 18),
          const Section(
            title: 'NFC security architecture',
            child: Column(
              children: [
                _SecurityRow(icon: Icons.verified_user_outlined, title: 'Cryptographic tag verification', subtitle: 'Registered identifiers are checked against the component identity and verification policy.'),
                _SecurityRow(icon: Icons.shield_outlined, title: 'NTAG 424 DNA / SUN ready', subtitle: 'The security model supports cryptographic NFC tag deployments where the physical tag provides signed dynamic data.'),
                _SecurityRow(icon: Icons.report_gmailerrorred_outlined, title: 'Tamper-aware binding', subtitle: 'Tamper-proof tag registrations are represented explicitly in the component-tag security type.'),
                _SecurityRow(icon: Icons.link_outlined, title: 'Blockchain integrity', subtitle: 'Maintenance records carry a deterministic hash that can be checked against the blockchain integrity service.'),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Section(
            title: 'Verification audit stream',
            child: loading
                ? const Center(child: CircularProgressIndicator(color: accent))
                : logs.isEmpty
                    ? const Text('No verification events recorded yet.', style: TextStyle(color: muted))
                    : Column(
                        children: logs.take(20).map((log) => EventRow(
                              title: log.status,
                              subtitle: '${log.createdAt}${log.reason.isEmpty ? '' : ' · ${log.reason}'}',
                              ok: log.status == 'AUTHENTIC' || log.status == 'PASSED',
                            )).toList(),
                      ),
          ),
        ],
      ),
    );
  }
}

class _SecurityRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _SecurityRow({required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(13)),
              child: Icon(icon, color: accent),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: const TextStyle(color: muted, height: 1.35)),
                ],
              ),
            ),
          ],
        ),
      );
}
