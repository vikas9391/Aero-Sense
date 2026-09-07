import 'package:flutter/material.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'core/api.dart';

final api = Api();

class Dashboard extends StatefulWidget {
  const Dashboard({super.key});
  @override
  State<Dashboard> createState() => _DashboardState();
}

class _DashboardState extends State<Dashboard> {
  Analytics? analytics;

  Future<void> load() async {
    try {
      analytics = await api.analytics();
    } catch (_) {}
    if (mounted) setState(() {});
  }

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  Widget build(BuildContext context) => RefreshIndicator(
        onRefresh: load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(22, 18, 22, 110),
          children: [
            const Text('OPERATIONS CONSOLE', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
            const SizedBox(height: 4),
            const Text('Aero-Sense', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
            const SizedBox(height: 4),
            const Text('Fleet and component intelligence at a glance.', style: TextStyle(color: muted)),
            const SizedBox(height: 18),
            CardBox(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.nfc_outlined, color: accent, size: 30),
                  const SizedBox(height: 16),
                  const Text('VERIFICATION CONTROL', style: TextStyle(color: accent, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
                  const SizedBox(height: 5),
                  const Text('Verify an aircraft component', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 7),
                  const Text('Use the physical NFC scanner to validate a component.', style: TextStyle(color: muted)),
                  const SizedBox(height: 15),
                  FilledButton.icon(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const VerifyScreen())),
                    icon: const Icon(Icons.nfc),
                    label: const Text('Start NFC verification'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('Live overview', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _stat('Aircraft', analytics?.aircraft),
                _stat('Components', analytics?.components),
                _stat('Maintenance', analytics?.maintenance),
                _stat('Verifications', analytics?.verifications),
              ],
            ),
            const SizedBox(height: 14),
            CardBox(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('VERIFICATION HEALTH', style: TextStyle(color: muted, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
                  const SizedBox(height: 8),
                  Text('${analytics?.passed ?? 0} passed / ${analytics?.failed ?? 0} failed', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  LinearProgressIndicator(
                    value: analytics == null || analytics!.verifications == 0 ? 0 : analytics!.passed / analytics!.verifications,
                    minHeight: 8,
                    borderRadius: BorderRadius.circular(8),
                    color: good,
                    backgroundColor: soft,
                  ),
                ],
              ),
            ),
          ],
        ),
      );

  Widget _stat(String label, int? value) => SizedBox(
        width: MediaQuery.sizeOf(context).width / 2 - 27,
        height: 105,
        child: CardBox(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(label == 'Aircraft' ? Icons.flight_outlined : label == 'Components' ? Icons.inventory_2_outlined : label == 'Maintenance' ? Icons.build_outlined : Icons.fact_check_outlined, color: accent),
              Text(value == null ? '—' : '$value', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
              Text(label, style: const TextStyle(color: muted)),
            ],
          ),
        ),
      );
}

class ComponentsScreen extends StatefulWidget {
  const ComponentsScreen({super.key});
  @override
  State<ComponentsScreen> createState() => _ComponentsState();
}

class _ComponentsState extends State<ComponentsScreen> {
  List<Component> items = [];
  String query = '';
  bool loading = true;

  Future<void> load() async {
    try {
      items = await api.components();
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = items.where((x) => '${x.serial} ${x.type} ${x.manufacturer} ${x.status}'.toLowerCase().contains(query.toLowerCase())).toList();
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(22, 18, 22, 110),
        children: [
          const Text('COMPONENT REGISTRY', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
          const SizedBox(height: 4),
          const Text('Components', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          const SizedBox(height: 15),
          TextField(onChanged: (v) => setState(() => query = v), decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Search serial, type or manufacturer')),
          const SizedBox(height: 12),
          if (loading) const Center(child: CircularProgressIndicator(color: accent)),
          ...filtered.map(
            (x) => CardBox(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(x.serial, style: const TextStyle(fontWeight: FontWeight.w800)),
                subtitle: Text('${x.manufacturer} · ${x.type}\n${x.aircraftRegistration ?? 'Unassigned'}', style: const TextStyle(color: muted)),
                trailing: StatusPill(x.status),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PassportScreen(component: x))),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class PassportScreen extends StatefulWidget {
  final Component component;
  const PassportScreen({required this.component, super.key});
  @override
  State<PassportScreen> createState() => _PassportState();
}

class _PassportState extends State<PassportScreen> {
  List<MaintenanceRecord> maintenance = [];
  List<VerificationLog> checks = [];
  bool loading = true;

  Future<void> load() async {
    try {
      final m = await api.maintenance();
      maintenance = m.where((x) => x.componentId == widget.component.id).toList();
      checks = await api.componentVerifications(widget.component.id);
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: bg,
        appBar: AppBar(title: const Text('Component passport'), backgroundColor: bg),
        body: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            CardBox(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [const Icon(Icons.qr_code_2, color: accent, size: 30), const Spacer(), StatusPill(widget.component.status)]),
                  const SizedBox(height: 15),
                  Text(widget.component.serial, style: const TextStyle(fontSize: 25, fontWeight: FontWeight.w800)),
                  Text(widget.component.type, style: const TextStyle(color: muted)),
                  const Divider(height: 28),
                  _kv('Manufacturer', widget.component.manufacturer),
                  _kv('Aircraft', widget.component.aircraftRegistration ?? 'Unassigned'),
                  _kv('Component UUID', widget.component.uuid),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Section(
              title: 'Verification history',
              child: loading
                  ? const CircularProgressIndicator(color: accent)
                  : checks.isEmpty
                      ? const Text('No verification records yet.', style: TextStyle(color: muted))
                      : Column(children: checks.map((x) => EventRow(title: x.status, subtitle: x.createdAt, ok: x.status == 'AUTHENTIC' || x.status == 'PASSED')).toList()),
            ),
            const SizedBox(height: 12),
            Section(
              title: 'Maintenance history',
              child: maintenance.isEmpty
                  ? const Text('No maintenance records yet.', style: TextStyle(color: muted))
                  : Column(children: maintenance.map((x) => EventRow(title: x.type, subtitle: '${x.createdAt} · ${x.technician}', ok: x.result == 'PASSED')).toList()),
            ),
          ],
        ),
      );

  Widget _kv(String k, String v) => Padding(
        padding: const EdgeInsets.only(bottom: 9),
        child: Row(children: [Expanded(child: Text(k, style: const TextStyle(color: muted))), Expanded(child: Text(v, style: const TextStyle(fontWeight: FontWeight.w700)))]),
      );
}

class VerifyScreen extends StatefulWidget {
  const VerifyScreen({super.key});
  @override
  State<VerifyScreen> createState() => _VerifyState();
}

class _VerifyState extends State<VerifyScreen> {
  bool scanning = false;
  VerificationResponse? result;
  String? error;

  Future<void> scan() async {
    if (scanning) return;
    setState(() {
      scanning = true;
      result = null;
      error = null;
    });
    try {
      if (!await NfcManager.instance.isAvailable()) {
        throw Exception('NFC is not available on this device.');
      }
      await NfcManager.instance.startSession(onDiscovered: (tag) async {
        try {
          final raw = tag.data['nfca']?['identifier'];
          final bytes = raw is List ? List<int>.from(raw) : <int>[];
          final id = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
          if (id.isEmpty) throw Exception('Unable to read the NFC tag identifier.');
          final response = await api.verifyNfc(id);
          if (mounted) setState(() => result = response);
        } catch (e) {
          if (mounted) setState(() => error = api.errorMessage(e));
        } finally {
          await NfcManager.instance.stopSession();
          if (mounted) setState(() => scanning = false);
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          error = api.errorMessage(e);
          scanning = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.fromLTRB(22, 18, 22, 110),
        children: [
          const Text('SECURE TAG CHECK', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
          const SizedBox(height: 4),
          const Text('Verify', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          const Text('Authenticate a component using the phone NFC reader.', style: TextStyle(color: muted)),
          const SizedBox(height: 18),
          CardBox(
            child: Column(
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: const BoxDecoration(color: Color(0xFFECECF8), shape: BoxShape.circle),
                  child: Icon(scanning ? Icons.radar : Icons.nfc_outlined, color: accent, size: 48),
                ),
                const SizedBox(height: 16),
                Text(scanning ? 'HOLD PHONE NEAR TAG' : 'READY TO VERIFY', style: const TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
                const SizedBox(height: 7),
                Text(scanning ? 'Scanning NFC…' : 'Place the phone near the tag', style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                const Text('The physical tag UID is read by Android and sent to the secure backend for authentication and component binding.', textAlign: TextAlign.center, style: TextStyle(color: muted, height: 1.5)),
                const SizedBox(height: 17),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: FilledButton.icon(onPressed: scanning ? null : scan, icon: const Icon(Icons.nfc), label: Text(scanning ? 'Scanning…' : 'Start NFC scan')),
                ),
                if (error != null) Padding(padding: const EdgeInsets.only(top: 15), child: Text(error!, style: const TextStyle(color: Colors.red))),
                if (result != null) Padding(padding: const EdgeInsets.only(top: 18), child: VerificationResult(result!)),
              ],
            ),
          ),
        ],
      );
}

class VerificationResult extends StatelessWidget {
  final VerificationResponse r;
  const VerificationResult(this.r, {super.key});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: r.verified ? const Color(0xFFE8F5F0) : const Color(0xFFFFEEEE), borderRadius: BorderRadius.circular(18)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(r.verified ? 'AUTHENTIC' : r.status, style: TextStyle(color: r.verified ? good : Colors.red, fontWeight: FontWeight.w900, letterSpacing: 1)),
            if (r.component != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text('${r.component!['serial_number'] ?? ''} · ${r.component!['aircraft'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
            const SizedBox(height: 10),
            ...r.checks.entries.map(
              (e) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Icon(e.value ? Icons.check_circle : Icons.cancel, size: 17, color: e.value ? good : Colors.red),
                    const SizedBox(width: 7),
                    Expanded(child: Text(e.key.replaceAll('_', ' '))),
                    Text(e.value ? 'PASS' : 'FAIL', style: TextStyle(fontWeight: FontWeight.w800, color: e.value ? good : Colors.red)),
                  ],
                ),
              ),
            ),
            if (r.reason != null && r.reason!.isNotEmpty)
              Padding(padding: const EdgeInsets.only(top: 5), child: Text(r.reason!, style: const TextStyle(color: Colors.red))),
          ],
        ),
      );
}

class ActivityScreen extends StatefulWidget {
  const ActivityScreen({super.key});
  @override
  State<ActivityScreen> createState() => _ActivityState();
}

class _ActivityState extends State<ActivityScreen> {
  List<VerificationLog> checks = [];
  List<MaintenanceRecord> maintenance = [];
  bool loading = true;

  Future<void> load() async {
    try {
      checks = await api.verificationLogs();
      maintenance = await api.maintenance();
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    rows.addAll(checks.map((x) => EventRow(title: 'Verification · ${x.status}', subtitle: x.createdAt, ok: x.status == 'AUTHENTIC' || x.status == 'PASSED')));
    rows.addAll(maintenance.map((x) => EventRow(title: 'Maintenance · ${x.type}', subtitle: '${x.createdAt} · ${x.technician}', ok: x.result == 'PASSED')));
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(22, 18, 22, 110),
        children: [
          const Text('AUDIT TRAIL', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
          const SizedBox(height: 4),
          const Text('Activity', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          const SizedBox(height: 15),
          if (loading) const Center(child: CircularProgressIndicator(color: accent)) else if (rows.isEmpty) const CardBox(child: Text('No activity recorded yet.', style: TextStyle(color: muted))) else ...rows,
        ],
      ),
    );
  }
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileState();
}

class _ProfileState extends State<ProfileScreen> {
  User? user;

  @override
  void initState() {
    super.initState();
    api.me().then((v) {
      if (mounted) setState(() => user = v);
    }).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.fromLTRB(22, 18, 22, 110),
        children: [
          const Text('IDENTITY & ACCESS', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
          const SizedBox(height: 4),
          const Text('Profile', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          const SizedBox(height: 16),
          CardBox(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const CircleAvatar(radius: 28, backgroundColor: Color(0xFFECECF8), child: Icon(Icons.person_outline, color: accent)),
                const SizedBox(height: 14),
                Text(user?.name ?? 'Loading…', style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800)),
                Text(user?.email ?? '', style: const TextStyle(color: muted)),
                const SizedBox(height: 15),
                StatusPill(user?.role ?? '—'),
                const SizedBox(height: 14),
                Text('Company ID: ${user?.companyId ?? '—'}', style: const TextStyle(color: muted)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const CardBox(
            child: ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.security_outlined, color: good),
              title: Text('JWT session', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Text('Stored securely on this device.', style: TextStyle(color: muted)),
            ),
          ),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: () async {
              await api.storage.delete(key: tokenKey);
              if (context.mounted) Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);
            },
            icon: const Icon(Icons.logout),
            label: const Text('Sign out'),
          ),
        ],
      );
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginState();
}

class _LoginState extends State<LoginScreen> {
  final company = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  bool busy = false;

  @override
  void dispose() {
    company.dispose();
    email.dispose();
    password.dispose();
    super.dispose();
  }

  Future<void> go() async {
    if (company.text.trim().isEmpty || email.text.trim().isEmpty || password.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter company, email and password.')));
      return;
    }
    setState(() => busy = true);
    try {
      final r = await api.login(company.text.trim(), email.text.trim(), password.text);
      final token = r['token'];
      if (token is! String || token.isEmpty) throw Exception('Login succeeded without a session token.');
      await api.storage.write(key: tokenKey, value: token);
      if (mounted) Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const AppShell()), (_) => false);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(api.errorMessage(e))));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              const SizedBox(height: 28),
              const Icon(Icons.flight_takeoff_rounded, size: 54, color: accent),
              const SizedBox(height: 14),
              const Center(child: Text('Aero-Sense', style: TextStyle(fontSize: 29, fontWeight: FontWeight.w800))),
              const Center(child: Text('Aircraft component intelligence', style: TextStyle(color: muted))),
              const SizedBox(height: 25),
              CardBox(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Welcome back', style: TextStyle(fontSize: 25, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 5),
                    const Text('Sign in to continue your operations', style: TextStyle(color: muted)),
                    const SizedBox(height: 18),
                    TextField(controller: company, decoration: const InputDecoration(labelText: 'Company')),
                    const SizedBox(height: 12),
                    TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email address')),
                    const SizedBox(height: 12),
                    TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
                    const SizedBox(height: 17),
                    SizedBox(width: double.infinity, height: 54, child: FilledButton(onPressed: busy ? null : go, child: Text(busy ? 'Signing in…' : 'Sign In'))),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
}

class AppShell extends StatefulWidget {
  const AppShell({super.key});
  @override
  State<AppShell> createState() => _ShellState();
}

class _ShellState extends State<AppShell> {
  int index = 0;
  final pages = const [Dashboard(), ComponentsScreen(), VerifyScreen(), ActivityScreen(), ProfileScreen()];

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(child: pages[index]),
        bottomNavigationBar: NavigationBar(
          selectedIndex: index,
          onDestinationSelected: (i) => setState(() => index = i),
          destinations: const [
            NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
            NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Parts'),
            NavigationDestination(icon: Icon(Icons.nfc_outlined), selectedIcon: Icon(Icons.nfc), label: 'Verify'),
            NavigationDestination(icon: Icon(Icons.timeline_outlined), selectedIcon: Icon(Icons.timeline), label: 'Activity'),
            NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
          ],
        ),
      );
}

class CardBox extends StatelessWidget {
  final Widget child;
  final EdgeInsets? margin;
  const CardBox({required this.child, this.margin, super.key});

  @override
  Widget build(BuildContext context) => Container(
        margin: margin,
        padding: const EdgeInsets.all(17),
        decoration: BoxDecoration(color: panel, borderRadius: BorderRadius.circular(24), border: Border.all(color: line)),
        child: child,
      );
}

class Section extends StatelessWidget {
  final String title;
  final Widget child;
  const Section({required this.title, required this.child, super.key});

  @override
  Widget build(BuildContext context) => CardBox(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)), const SizedBox(height: 12), child]),
      );
}

class StatusPill extends StatelessWidget {
  final String value;
  const StatusPill(this.value, {super.key});

  @override
  Widget build(BuildContext context) {
    final ok = value == 'ACTIVE' || value == 'AUTHENTIC' || value == 'PASSED';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(color: ok ? const Color(0xFFE8F5F0) : const Color(0xFFF1EEE8), borderRadius: BorderRadius.circular(30)),
      child: Text(value.isEmpty ? 'UNKNOWN' : value, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: ok ? good : muted)),
    );
  }
}

class EventRow extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool ok;
  const EventRow({required this.title, required this.subtitle, required this.ok, super.key});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(width: 10, height: 10, margin: const EdgeInsets.only(top: 5), decoration: BoxDecoration(color: ok ? good : Colors.red, shape: BoxShape.circle)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontWeight: FontWeight.w800)), Text(subtitle, style: const TextStyle(color: muted, fontSize: 11))])),
          ],
        ),
      );
}
