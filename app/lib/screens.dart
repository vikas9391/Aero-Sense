import 'package:flutter/material.dart';

import 'core/api.dart';
import 'management_pages.dart';
import 'nfc_pages.dart';
import 'registration_pages.dart';
import 'security_audit.dart';
import 'super_admin.dart';
import 'theme.dart';
import 'widgets.dart';

final api = Api();

class Dashboard extends StatefulWidget {
  const Dashboard({super.key});

  @override
  State<Dashboard> createState() => _DashboardState();
}

class _DashboardState extends State<Dashboard> {
  Analytics? data;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      data = await api.analytics();
    } catch (_) {}
    if (mounted) {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = data?.verifications ?? 0;
    final passed = data?.passed ?? 0;
    final health = total == 0 ? 0.0 : (passed / total).clamp(0.0, 1.0);
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        children: [
          const Text('OPERATIONS CONSOLE', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
          const SizedBox(height: 5),
          const Text('Aero-Sense', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          const SizedBox(height: 5),
          const Text('Fleet and component intelligence at a glance.', style: TextStyle(color: muted, height: 1.4)),
          const SizedBox(height: 18),
          CardBox(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.nfc_outlined, color: accent, size: 30),
                const SizedBox(height: 12),
                const Text('VERIFICATION CONTROL', style: TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
                const SizedBox(height: 6),
                const Text('Verify an aircraft component', style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800)),
                const SizedBox(height: 7),
                const Text('Scan a registered physical NFC tag and validate its component identity.', style: TextStyle(color: muted, height: 1.4)),
                const SizedBox(height: 15),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NfcVerificationScreen())),
                    icon: const Icon(Icons.nfc),
                    label: const Text('Start NFC verification'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('Live overview', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          if (loading)
            const LinearProgressIndicator(color: accent)
          else
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _stat('Aircraft', data?.aircraft ?? 0, Icons.flight_outlined),
                _stat('Components', data?.components ?? 0, Icons.inventory_2_outlined),
                _stat('Maintenance', data?.maintenance ?? 0, Icons.build_outlined),
                _stat('Verifications', data?.verifications ?? 0, Icons.fact_check_outlined),
              ],
            ),
          const SizedBox(height: 14),
          CardBox(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('VERIFICATION HEALTH', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
                const SizedBox(height: 8),
                Text('$passed passed / ${data?.failed ?? 0} failed', style: const TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                LinearProgressIndicator(value: health, minHeight: 8, borderRadius: BorderRadius.circular(8), color: good, backgroundColor: soft),
              ],
            ),
          ),
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

class ComponentsScreen extends StatefulWidget {
  const ComponentsScreen({super.key});

  @override
  State<ComponentsScreen> createState() => _ComponentsState();
}

class _ComponentsState extends State<ComponentsScreen> {
  List<Component> items = [];
  User? user;
  bool loading = true;
  String query = '';

  @override
  void initState() {
    super.initState();
    load();
    api.me().then((value) {
      if (mounted) {
        setState(() => user = value);
      }
    }).catchError((_) {});
  }

  Future<void> load() async {
    try {
      items = await api.components();
    } catch (_) {}
    if (mounted) {
      setState(() => loading = false);
    }
  }

  bool get canRegister {
    final role = (user?.role ?? '').toUpperCase();
    return role == 'COMPANY_ADMIN' || role == 'MANUFACTURER';
  }

  @override
  Widget build(BuildContext context) {
    final filtered = items.where((item) => '${item.serial} ${item.type} ${item.manufacturer} ${item.status}'.toLowerCase().contains(query.toLowerCase())).toList();
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        children: [
          const Text('COMPONENT REGISTRY', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
          const SizedBox(height: 5),
          const Text('Components', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          const Text('Registered physical components with digital identity mapping.', style: TextStyle(color: muted, height: 1.4)),
          const SizedBox(height: 15),
          if (canRegister) ...[
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterTagScreen())),
                    icon: const Icon(Icons.link_outlined),
                    label: const Text('Bind NFC / RFID'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterComponentScreen())),
                    icon: const Icon(Icons.add_box_outlined),
                    label: const Text('Register'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
          ],
          TextField(
            onChanged: (value) => setState(() => query = value),
            decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Search serial, type or manufacturer'),
          ),
          const SizedBox(height: 12),
          if (loading)
            const Center(child: CircularProgressIndicator(color: accent))
          else if (filtered.isEmpty)
            const CardBox(child: Text('No matching components found.', style: TextStyle(color: muted)))
          else
            ...filtered.map(
              (item) => CardBox(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.memory_outlined, color: accent, size: 28),
                  title: Text(item.serial, style: const TextStyle(fontWeight: FontWeight.w800)),
                  subtitle: Text('${item.manufacturer} · ${item.type}\n${item.aircraftRegistration ?? 'Unassigned'}', style: const TextStyle(color: muted, height: 1.35)),
                  trailing: StatusPill(item.status),
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PassportScreen(component: item))),
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

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      maintenance = (await api.maintenance()).where((item) => item.componentId == widget.component.id).toList();
    } catch (_) {
      maintenance = [];
    }
    try {
      checks = await api.componentVerifications(widget.component.id);
    } catch (_) {
      checks = [];
    }
    if (mounted) {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(title: const Text('Component passport'), backgroundColor: bg),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          CardBox(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [const Icon(Icons.memory_outlined, color: accent, size: 30), const Spacer(), StatusPill(widget.component.status)]),
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
                    ? const Text('No verification records available for this account.', style: TextStyle(color: muted))
                    : Column(children: checks.map((item) => EventRow(title: item.status, subtitle: item.createdAt, ok: item.status == 'AUTHENTIC' || item.status == 'PASSED')).toList()),
          ),
          const SizedBox(height: 12),
          Section(
            title: 'Maintenance history',
            child: loading
                ? const CircularProgressIndicator(color: accent)
                : maintenance.isEmpty
                    ? const Text('No maintenance records available for this account.', style: TextStyle(color: muted))
                    : Column(children: maintenance.map((item) => EventRow(title: item.type, subtitle: '${item.createdAt} · ${item.technician}', ok: item.result == 'PASSED')).toList()),
          ),
        ],
      ),
    );
  }

  Widget _kv(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: Text(label, style: const TextStyle(color: muted))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w700))),
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
  static const permissions = <String, List<String>>{
    'SUPER_ADMIN': ['Onboard Companies', 'Provision Company Admins', 'View Company Users & Emails', 'Suspend/Reactivate Companies', 'View Cross-Company Work Summaries'],
    'COMPANY_ADMIN': ['Manage Company Users & Roles', 'View Company Work Analytics', 'Register Aircraft', 'Register Component', 'Bind NFC/RFID Tags', 'Log Maintenance Records', 'Execute NFC Verification', 'Access Security Audits'],
    'MANUFACTURER': ['Register Component', 'Bind NFC/RFID Tags', 'Execute NFC Verification', 'View Fleet'],
    'MAINTENANCE_TECHNICIAN': ['Log Maintenance Records', 'Execute NFC Verification', 'View Fleet & Components'],
    'INSPECTOR': ['Execute NFC Verification', 'Access Security Audits', 'View Fleet & Components'],
    'VIEWER': ['View Fleet & Components'],
  };

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final value = await api.me();
      if (mounted) {
        setState(() => user = value);
      }
    } catch (_) {}
  }

  Future<void> signOut() async {
    await api.storage.delete(key: tokenKey);
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);
  }

  Future<void> changePassword() async {
    final result = await showDialog<bool>(context: context, builder: (_) => const _ChangePasswordDialog());
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password updated successfully.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final role = (user?.role ?? '').toUpperCase();
    final rolePermissions = permissions[role] ?? const <String>[];
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
      children: [
        const Text('IDENTITY & ACCESS', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
        const SizedBox(height: 5),
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
              const SizedBox(height: 6),
              Text('Account UUID: ${user?.uuid ?? '—'}', style: const TextStyle(color: muted)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Section(
          title: 'Role-Based System Permissions',
          child: rolePermissions.isEmpty
              ? const Text('No permissions loaded.', style: TextStyle(color: muted))
              : Wrap(spacing: 8, runSpacing: 8, children: rolePermissions.map((p) => Chip(avatar: const Icon(Icons.check_circle_outline, size: 16, color: good), label: Text(p))).toList()),
        ),
        const SizedBox(height: 12),
        const CardBox(child: ListTile(contentPadding: EdgeInsets.zero, leading: Icon(Icons.security_outlined, color: good), title: Text('Secure session', style: TextStyle(fontWeight: FontWeight.w700)), subtitle: Text('Authentication token is stored securely on this device.', style: TextStyle(color: muted)))),
        const SizedBox(height: 12),
        FilledButton.icon(onPressed: changePassword, icon: const Icon(Icons.key_outlined), label: const Text('Change password')),
        const SizedBox(height: 10),
        OutlinedButton.icon(onPressed: signOut, icon: const Icon(Icons.logout), label: const Text('Sign out')),
      ],
    );
  }
}

class _ChangePasswordDialog extends StatefulWidget {
  const _ChangePasswordDialog();

  @override
  State<_ChangePasswordDialog> createState() => _ChangePasswordDialogState();
}

class _ChangePasswordDialogState extends State<_ChangePasswordDialog> {
  final current = TextEditingController();
  final next = TextEditingController();
  final confirm = TextEditingController();
  bool saving = false;
  bool hideCurrent = true;
  bool hideNext = true;
  bool hideConfirm = true;
  String? error;

  @override
  void dispose() {
    current.dispose();
    next.dispose();
    confirm.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    setState(() => error = null);
    if (current.text.isEmpty) {
      setState(() => error = 'Enter your current password.');
      return;
    }
    if (next.text.length < 8) {
      setState(() => error = 'New password must be at least 8 characters.');
      return;
    }
    if (next.text != confirm.text) {
      setState(() => error = 'New password and confirmation do not match.');
      return;
    }
    setState(() => saving = true);
    try {
      await api.changePassword(current.text, next.text);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) setState(() => error = api.errorMessage(e));
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Change password'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (error != null) Padding(padding: const EdgeInsets.only(bottom: 10), child: Text(error!, style: const TextStyle(color: Colors.red))),
            _passwordField(current, 'Current password', hideCurrent, () => setState(() => hideCurrent = !hideCurrent)),
            const SizedBox(height: 10),
            _passwordField(next, 'New password', hideNext, () => setState(() => hideNext = !hideNext), hint: 'Minimum 8 characters'),
            const SizedBox(height: 10),
            _passwordField(confirm, 'Confirm new password', hideConfirm, () => setState(() => hideConfirm = !hideConfirm)),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: saving ? null : () => Navigator.pop(context), child: const Text('Cancel')),
        FilledButton(onPressed: saving ? null : submit, child: Text(saving ? 'Updating…' : 'Update password')),
      ],
    );
  }

  Widget _passwordField(TextEditingController controller, String label, bool hidden, VoidCallback toggle, {String? hint}) {
    return TextField(
      controller: controller,
      obscureText: hidden,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        suffixIcon: IconButton(onPressed: toggle, icon: Icon(hidden ? Icons.visibility_outlined : Icons.visibility_off_outlined)),
      ),
    );
  }
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
      final response = await api.login(company.text.trim(), email.text.trim(), password.text);
      final token = response['token'];
      if (token is! String || token.isEmpty) throw Exception('Login succeeded without a session token.');
      await api.storage.write(key: tokenKey, value: token);
      if (mounted) Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const AppShell()), (_) => false);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(api.errorMessage(e)), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: CardBox(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.flight_takeoff_rounded, color: accent, size: 42),
                    const SizedBox(height: 18),
                    const Text('AERO-SENSE', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 1.4)),
                    const SizedBox(height: 4),
                    const Text('Secure aircraft component intelligence', style: TextStyle(color: muted)),
                    const SizedBox(height: 25),
                    TextField(controller: company, decoration: const InputDecoration(labelText: 'Company name', prefixIcon: Icon(Icons.business_outlined))),
                    const SizedBox(height: 12),
                    TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
                    const SizedBox(height: 12),
                    TextField(controller: password, obscureText: true, onSubmitted: (_) { if (!busy) go(); }, decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline))),
                    const SizedBox(height: 18),
                    SizedBox(width: double.infinity, height: 52, child: FilledButton.icon(onPressed: busy ? null : go, icon: const Icon(Icons.login), label: Text(busy ? 'Signing in…' : 'Sign in'))),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  User? user;
  int index = 0;

  @override
  void initState() {
    super.initState();
    api.me().then((value) {
      if (mounted) setState(() => user = value);
    }).catchError((_) {});
  }

  String get role => (user?.role ?? '').toUpperCase();
  bool get isSuperAdmin => role == 'SUPER_ADMIN';
  bool get isCompanyAdmin => role == 'COMPANY_ADMIN';
  bool get canBind => isCompanyAdmin || role == 'MANUFACTURER';
  bool get canVerify => isCompanyAdmin || role == 'MANUFACTURER' || role == 'MAINTENANCE_TECHNICIAN' || role == 'INSPECTOR';
  bool get canAudit => isCompanyAdmin || role == 'INSPECTOR';
  bool get canMaintain => isCompanyAdmin || role == 'MAINTENANCE_TECHNICIAN';

  List<_NavItem> get nav {
    if (isSuperAdmin) {
      return const [
        _NavItem('Companies', Icons.business_outlined),
        _NavItem('Profile', Icons.person_outline),
      ];
    }
    final items = <_NavItem>[];
    if (isCompanyAdmin) items.add(const _NavItem('Dashboard', Icons.dashboard_outlined));
    if (canVerify) items.add(const _NavItem('Verify', Icons.verified_user_outlined));
    if (canBind) items.add(const _NavItem('NFC & Tags', Icons.nfc_outlined));
    items.add(const _NavItem('Aircraft', Icons.flight_outlined));
    items.add(const _NavItem('Components', Icons.memory_outlined));
    if (canMaintain) items.add(const _NavItem('Maintenance', Icons.build_outlined));
    if (isCompanyAdmin) items.add(const _NavItem('Users', Icons.people_outline));
    if (isCompanyAdmin) items.add(const _NavItem('Analytics', Icons.analytics_outlined));
    if (canAudit) items.add(const _NavItem('Security & Audit', Icons.security_outlined));
    items.add(const _NavItem('Profile', Icons.person_outline));
    return items;
  }

  Widget pageFor(String title) {
    switch (title) {
      case 'Companies': return const CompanyManagementScreen();
      case 'Dashboard': return const Dashboard();
      case 'Verify': return const NfcVerificationScreen();
      case 'NFC & Tags': return const NfcCenterScreen();
      case 'Aircraft': return const AircraftScreen();
      case 'Components': return const ComponentsScreen();
      case 'Maintenance': return const MaintenanceScreen();
      case 'Users': return const UsersScreen();
      case 'Analytics': return const AnalyticsScreen();
      case 'Security & Audit': return const SecurityAuditScreen();
      case 'Profile': return const ProfileScreen();
      default: return const ComponentsScreen();
    }
  }

  Future<void> signOut() async {
    await api.storage.delete(key: tokenKey);
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    final items = nav;
    if (items.isEmpty) return const Scaffold(body: Center(child: CircularProgressIndicator(color: accent)));
    if (index >= items.length) index = 0;
    final current = items[index];
    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: bg,
        title: Text(current.label, style: const TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          if (canBind) IconButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterTagScreen())), icon: const Icon(Icons.add_link_outlined), tooltip: 'Bind NFC / RFID'),
          IconButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen())), icon: const Icon(Icons.account_circle_outlined)),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 14),
                child: Row(children: [const Icon(Icons.flight_takeoff_rounded, color: accent, size: 30), const SizedBox(width: 10), const Expanded(child: Text('AERO-SENSE', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.2)))]),
              ),
              if (user != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(user!.name, style: const TextStyle(fontWeight: FontWeight.w800)), const SizedBox(height: 3), Text(user!.role, style: const TextStyle(color: muted, fontSize: 11))]),
                  ),
                ),
              const SizedBox(height: 12),
              const Divider(height: 1),
              Expanded(
                child: ListView.builder(
                  itemCount: items.length,
                  itemBuilder: (_, i) => ListTile(selected: i == index, leading: Icon(items[i].icon), title: Text(items[i].label), onTap: () { setState(() => index = i); Navigator.pop(context); }),
                ),
              ),
              const Divider(height: 1),
              ListTile(leading: const Icon(Icons.logout), title: const Text('Sign out'), onTap: signOut),
            ],
          ),
        ),
      ),
      body: pageFor(current.label),
    );
  }
}

class _NavItem {
  final String label;
  final IconData icon;

  const _NavItem(this.label, this.icon);
}
