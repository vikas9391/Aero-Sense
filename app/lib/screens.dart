import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'core/api.dart';
import 'theme.dart';
import 'widgets.dart';

final api = Api();

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
      if (mounted) setState(() => user = value);
    }).catchError((_) {});
  }

  Future<void> load() async {
    try {
      items = await api.components();
    } catch (_) {}
    if (mounted) setState(() => loading = false);
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
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 110),
        children: [
          const Text('COMPONENT REGISTRY', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
          const SizedBox(height: 5),
          const Text('Components', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          const Text('Registered physical components with digital identity mapping.', style: TextStyle(color: muted, height: 1.4)),
          const SizedBox(height: 15),
          if (canRegister)
            LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 430;
                final buttons = [
                  OutlinedButton.icon(onPressed: () => context.go('/register-tag'), icon: const Icon(Icons.link_outlined), label: const Text('Bind NFC / RFID')),
                  FilledButton.icon(onPressed: () => context.go('/register-component'), icon: const Icon(Icons.add_box_outlined), label: const Text('Register')),
                ];
                if (compact) {
                  return Column(children: [
                    SizedBox(width: double.infinity, child: buttons[0]),
                    const SizedBox(height: 10),
                    SizedBox(width: double.infinity, child: buttons[1]),
                  ]);
                }
                return Row(children: [
                  Expanded(child: buttons[0]),
                  const SizedBox(width: 10),
                  Expanded(child: buttons[1]),
                ]);
              },
            ),
          if (canRegister) const SizedBox(height: 14),
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
                  onTap: () => context.go('/passport', extra: item),
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
  User? user;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      user = await api.me();
    } catch (_) {}
    final role = (user?.role ?? '').toUpperCase();
    if (role == 'COMPANY_ADMIN' || role == 'MAINTENANCE_TECHNICIAN') {
      try {
        maintenance = (await api.maintenance()).where((item) => item.componentId == widget.component.id).toList();
      } catch (_) {}
    }
    if (role == 'COMPANY_ADMIN' || role == 'MANUFACTURER' || role == 'MAINTENANCE_TECHNICIAN' || role == 'INSPECTOR') {
      try {
        checks = await api.componentVerifications(widget.component.id);
      } catch (_) {}
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final role = (user?.role ?? '').toUpperCase();
    final canSeeMaintenance = role == 'COMPANY_ADMIN' || role == 'MAINTENANCE_TECHNICIAN';
    final canSeeVerification = role == 'COMPANY_ADMIN' || role == 'MANUFACTURER' || role == 'MAINTENANCE_TECHNICIAN' || role == 'INSPECTOR';
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 110),
      children: [
        CardBox(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [const Icon(Icons.memory_outlined, color: accent, size: 30), const Spacer(), StatusPill(widget.component.status)]),
            const SizedBox(height: 15),
            Text(widget.component.serial, style: const TextStyle(fontSize: 25, fontWeight: FontWeight.w800)),
            Text(widget.component.type, style: const TextStyle(color: muted)),
            const Divider(height: 28),
            _kv('Manufacturer', widget.component.manufacturer),
            _kv('Aircraft', widget.component.aircraftRegistration ?? 'Unassigned'),
            _kv('Component UUID', widget.component.uuid),
          ]),
        ),
        if (canSeeVerification) ...[
          const SizedBox(height: 12),
          Section(
            title: 'Verification history',
            child: loading
                ? const CircularProgressIndicator(color: accent)
                : checks.isEmpty
                    ? const Text('No verification records available for this account.', style: TextStyle(color: muted))
                    : Column(children: checks.map((item) => EventRow(title: item.status, subtitle: item.createdAt, ok: item.status == 'AUTHENTIC' || item.status == 'PASSED')).toList()),
          ),
        ],
        if (canSeeMaintenance) ...[
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
      ],
    );
  }

  Widget _kv(String label, String value) => Padding(
        padding: const EdgeInsets.only(bottom: 9),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(child: Text(label, style: const TextStyle(color: muted))),
          const SizedBox(width: 12),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w700))),
        ]),
      );
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
    api.me().then((value) {
      if (mounted) setState(() => user = value);
    }).catchError((_) {});
  }

  Future<void> signOut() async {
    await api.storage.delete(key: tokenKey);
    if (mounted) context.go('/login');
  }

  Future<void> changePassword() async {
    final result = await showDialog<bool>(context: context, builder: (_) => const _ChangePasswordDialog());
    if (result == true && mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password updated successfully.')));
  }

  @override
  Widget build(BuildContext context) {
    final role = (user?.role ?? '').toUpperCase();
    final rolePermissions = permissions[role] ?? const <String>[];
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 110),
      children: [
        const Text('IDENTITY & ACCESS', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
        const SizedBox(height: 5),
        const Text('Profile', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
        const SizedBox(height: 16),
        CardBox(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
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
          ]),
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
  Widget build(BuildContext context) => AlertDialog(
        title: const Text('Change password'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            if (error != null) Padding(padding: const EdgeInsets.only(bottom: 10), child: Text(error!, style: const TextStyle(color: Colors.red))),
            _field(current, 'Current password', hideCurrent, () => setState(() => hideCurrent = !hideCurrent)),
            const SizedBox(height: 10),
            _field(next, 'New password', hideNext, () => setState(() => hideNext = !hideNext), hint: 'Minimum 8 characters'),
            const SizedBox(height: 10),
            _field(confirm, 'Confirm new password', hideConfirm, () => setState(() => hideConfirm = !hideConfirm)),
          ]),
        ),
        actions: [
          TextButton(onPressed: saving ? null : () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(onPressed: saving ? null : submit, child: Text(saving ? 'Updating…' : 'Update password')),
        ],
      );

  Widget _field(TextEditingController controller, String label, bool hidden, VoidCallback toggle, {String? hint}) => TextField(
        controller: controller,
        obscureText: hidden,
        decoration: InputDecoration(labelText: label, hintText: hint, suffixIcon: IconButton(onPressed: toggle, icon: Icon(hidden ? Icons.visibility_outlined : Icons.visibility_off_outlined))),
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
  bool showPassword = false;

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
      if (mounted) context.go('/dashboard');
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(api.errorMessage(e)), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: bg,
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 520),
                child: CardBox(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Icon(Icons.flight_takeoff_rounded, color: accent, size: 42),
                    const SizedBox(height: 18),
                    const Text('AERO-SENSE', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w900, letterSpacing: 1.4)),
                    const SizedBox(height: 4),
                    const Text('Secure aircraft component intelligence', style: TextStyle(color: muted)),
                    const SizedBox(height: 25),
                    TextField(controller: company, decoration: const InputDecoration(labelText: 'Company name', prefixIcon: Icon(Icons.business_outlined))),
                    const SizedBox(height: 12),
                    TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
                    const SizedBox(height: 12),
                    TextField(controller: password, obscureText: !showPassword, onSubmitted: (_) { if (!busy) go(); }, decoration: InputDecoration(labelText: 'Password', prefixIcon: const Icon(Icons.lock_outline), suffixIcon: IconButton(onPressed: () => setState(() => showPassword = !showPassword), tooltip: showPassword ? 'Hide password' : 'Show password', icon: Icon(showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined)))),
                    const SizedBox(height: 18),
                    SizedBox(width: double.infinity, height: 52, child: FilledButton.icon(onPressed: busy ? null : go, icon: const Icon(Icons.login), label: Text(busy ? 'Signing in…' : 'Sign in'))),
                  ]),
                ),
              ),
            ),
          ),
        ),
      );
}
