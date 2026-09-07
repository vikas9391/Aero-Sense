import 'package:flutter/material.dart';
import 'core/api.dart';
import 'theme.dart';
import 'widgets.dart';

class UsersScreen extends StatefulWidget {
  const UsersScreen({super.key});
  @override State<UsersScreen> createState() => _UsersState();
}

class _UsersState extends State<UsersScreen> {
  List<User> users = [];
  bool loading = true;
  Future<void> load() async {
    try { users = await api.users(); } catch (_) {}
    if (mounted) setState(() => loading = false);
  }
  @override void initState() { super.initState(); load(); }
  Future<void> create() async {
    final d = await showDialog<List<String>>(context: context, builder: (_) => const _UserDialog());
    if (d == null) return;
    try {
      await api.createUser(d[0], d[1], d[2], d[3]);
      await load();
      if (mounted) _msg('User created successfully.');
    } catch (e) { if (mounted) _msg(api.errorMessage(e), true); }
  }
  void _msg(String s, [bool error = false]) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s), backgroundColor: error ? Colors.red : null));
  @override Widget build(BuildContext context) => Scaffold(
    backgroundColor: bg,
    appBar: AppBar(title: const Text('User Management'), backgroundColor: bg, actions: [IconButton(onPressed: create, icon: const Icon(Icons.person_add_alt_1))]),
    body: RefreshIndicator(onRefresh: load, child: ListView(padding: const EdgeInsets.all(20), children: [
      const Text('TEAM & ACCESS', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
      const SizedBox(height: 4), const Text('Users', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
      const SizedBox(height: 5), const Text('Create and review accounts within your company.', style: TextStyle(color: muted)),
      const SizedBox(height: 18),
      CardBox(child: Column(children: [
        if (loading) const Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator(color: accent))
        else if (users.isEmpty) const Text('No users yet.', style: TextStyle(color: muted))
        else ...users.map((u) => ListTile(contentPadding: EdgeInsets.zero, leading: CircleAvatar(backgroundColor: soft, child: const Icon(Icons.person_outline, color: accent)), title: Text(u.name, style: const TextStyle(fontWeight: FontWeight.w700)), subtitle: Text(u.email, style: const TextStyle(color: muted)), trailing: StatusPill(u.role))),
      ])),
      const SizedBox(height: 14), FilledButton.icon(onPressed: create, icon: const Icon(Icons.person_add), label: const Text('Add New User')),
    ])),
  );
}

class AircraftScreen extends StatefulWidget {
  const AircraftScreen({super.key});
  @override State<AircraftScreen> createState() => _AircraftState();
}
class _AircraftState extends State<AircraftScreen> {
  List<Aircraft> items = [];
  bool loading = true;
  Future<void> load() async { try { items = await api.aircraft(); } catch (_) {} if (mounted) setState(() => loading = false); }
  @override void initState() { super.initState(); load(); }
  Future<void> create() async {
    final d = await showDialog<List<String>>(context: context, builder: (_) => const _AircraftDialog());
    if (d == null) return;
    try { await api.createAircraft({'registration_number': d[0], 'model': d[1], 'manufacturer': d[2], 'status': d[3]}); await load(); if (mounted) _msg('Aircraft added.'); }
    catch (e) { if (mounted) _msg(api.errorMessage(e), true); }
  }
  void _msg(String s, [bool error = false]) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s), backgroundColor: error ? Colors.red : null));
  @override Widget build(BuildContext context) => Scaffold(
    backgroundColor: bg,
    appBar: AppBar(title: const Text('Aircraft Fleet'), backgroundColor: bg, actions: [IconButton(onPressed: create, icon: const Icon(Icons.add))]),
    body: RefreshIndicator(onRefresh: load, child: ListView(padding: const EdgeInsets.all(20), children: [
      const Text('CORE OPERATIONS', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
      const SizedBox(height: 4), const Text('Aircraft', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)), const SizedBox(height: 18),
      if (loading) const Center(child: CircularProgressIndicator(color: accent))
      else if (items.isEmpty) const CardBox(child: Text('No aircraft registered yet.', style: TextStyle(color: muted)))
      else ...items.map((a) => CardBox(margin: const EdgeInsets.only(bottom: 10), child: ListTile(contentPadding: EdgeInsets.zero, leading: const Icon(Icons.flight_outlined, color: accent, size: 30), title: Text(a.registration, style: const TextStyle(fontWeight: FontWeight.w800)), subtitle: Text('${a.manufacturer} · ${a.model}', style: const TextStyle(color: muted)), trailing: StatusPill(a.status)))),
      const SizedBox(height: 10), FilledButton.icon(onPressed: create, icon: const Icon(Icons.add), label: const Text('Add Aircraft')),
    ])),
  );
}

class MaintenanceScreen extends StatefulWidget {
  const MaintenanceScreen({super.key});
  @override State<MaintenanceScreen> createState() => _MaintenanceState();
}
class _MaintenanceState extends State<MaintenanceScreen> {
  List<MaintenanceRecord> items = [];
  List<Component> components = [];
  bool loading = true;
  Future<void> load() async { try { items = await api.maintenance(); components = await api.components(); } catch (_) {} if (mounted) setState(() => loading = false); }
  @override void initState() { super.initState(); load(); }
  Future<void> create() async {
    if (components.isEmpty) { _msg('Create a component first.', true); return; }
    final d = await showDialog<List<String>>(context: context, builder: (_) => _MaintenanceDialog(components: components));
    if (d == null) return;
    try { await api.createMaintenance({'component_id': int.parse(d[0]), 'maintenance_type': d[1], 'description': d[2], 'parts_replaced': d[3], 'inspection_result': d[4]}); await load(); if (mounted) _msg('Maintenance record created.'); }
    catch (e) { if (mounted) _msg(api.errorMessage(e), true); }
  }
  void _msg(String s, [bool error = false]) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s), backgroundColor: error ? Colors.red : null));
  @override Widget build(BuildContext context) => Scaffold(
    backgroundColor: bg,
    appBar: AppBar(title: const Text('Maintenance'), backgroundColor: bg, actions: [IconButton(onPressed: create, icon: const Icon(Icons.add_task))]),
    body: RefreshIndicator(onRefresh: load, child: ListView(padding: const EdgeInsets.all(20), children: [
      const Text('MANAGEMENT & AUDIT', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)), const SizedBox(height: 4),
      const Text('Maintenance', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)), const SizedBox(height: 18),
      if (loading) const Center(child: CircularProgressIndicator(color: accent))
      else if (items.isEmpty) const CardBox(child: Text('No maintenance records yet.', style: TextStyle(color: muted)))
      else ...items.map((x) => CardBox(margin: const EdgeInsets.only(bottom: 10), child: ListTile(contentPadding: EdgeInsets.zero, leading: const Icon(Icons.build_outlined, color: accent), title: Text(x.type, style: const TextStyle(fontWeight: FontWeight.w800)), subtitle: Text('${x.technician} · ${x.createdAt}\n${x.description}', style: const TextStyle(color: muted)), trailing: StatusPill(x.result)))),
      const SizedBox(height: 10), FilledButton.icon(onPressed: create, icon: const Icon(Icons.add_task), label: const Text('Log Maintenance')),
    ])),
  );
}

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});
  @override State<AnalyticsScreen> createState() => _AnalyticsState();
}
class _AnalyticsState extends State<AnalyticsScreen> {
  Analytics? data;
  bool loading = true;
  Future<void> load() async { try { data = await api.analytics(); } catch (_) {} if (mounted) setState(() => loading = false); }
  @override void initState() { super.initState(); load(); }
  @override Widget build(BuildContext context) => Scaffold(
    backgroundColor: bg,
    appBar: AppBar(title: const Text('Work Analytics'), backgroundColor: bg),
    body: RefreshIndicator(onRefresh: load, child: ListView(padding: const EdgeInsets.all(20), children: [
      const Text('MANAGEMENT & AUDIT', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)), const SizedBox(height: 4),
      const Text('Overall Work', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)), const SizedBox(height: 18),
      if (loading) const Center(child: CircularProgressIndicator(color: accent)) else ...[
        _tile('Users', data?.users, Icons.people_outline), _tile('Aircraft', data?.aircraft, Icons.flight_outlined), _tile('Components', data?.components, Icons.memory_outlined), _tile('Maintenance Records', data?.maintenance, Icons.build_outlined), _tile('Verifications', data?.verifications, Icons.nfc_outlined),
        CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Verification health', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)), const SizedBox(height: 10),
          Text('${data?.passed ?? 0} passed · ${data?.failed ?? 0} failed', style: const TextStyle(color: muted)), const SizedBox(height: 10),
          LinearProgressIndicator(value: data == null || data!.verifications == 0 ? 0 : data!.passed / data!.verifications, minHeight: 8, borderRadius: BorderRadius.circular(8), color: good, backgroundColor: soft),
        ])),
      ],
    ])),
  );
  Widget _tile(String label, int? value, IconData icon) => CardBox(margin: const EdgeInsets.only(bottom: 10), child: ListTile(contentPadding: EdgeInsets.zero, leading: Icon(icon, color: accent), title: Text(label, style: const TextStyle(color: muted)), trailing: Text('${value ?? 0}', style: const TextStyle(fontSize: 25, fontWeight: FontWeight.w800))));
}

class _UserDialog extends StatefulWidget { const _UserDialog(); @override State<_UserDialog> createState() => _UserDialogState(); }
class _UserDialogState extends State<_UserDialog> {
  final n = TextEditingController(), e = TextEditingController(), p = TextEditingController();
  String role = 'VIEWER'; bool obscure = true;
  final roles = const ['COMPANY_ADMIN', 'MANUFACTURER', 'MAINTENANCE_TECHNICIAN', 'INSPECTOR', 'VIEWER'];
  @override void dispose() { n.dispose(); e.dispose(); p.dispose(); super.dispose(); }
  @override Widget build(BuildContext context) => AlertDialog(
    title: const Text('Add New User'),
    content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
      TextField(controller: n, decoration: const InputDecoration(labelText: 'Full Name')), const SizedBox(height: 10),
      TextField(controller: e, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')), const SizedBox(height: 10),
      TextField(controller: p, obscureText: obscure, decoration: InputDecoration(labelText: 'Password', hintText: 'Minimum 8 characters', suffixIcon: IconButton(onPressed: () => setState(() => obscure = !obscure), icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined)))), const SizedBox(height: 10),
      DropdownButtonFormField<String>(initialValue: role, decoration: const InputDecoration(labelText: 'Role'), items: roles.map((r) => DropdownMenuItem(value: r, child: Text(r.replaceAll('_', ' ')))).toList(), onChanged: (v) => setState(() => role = v!)),
    ])),
    actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')), FilledButton(onPressed: n.text.trim().isEmpty || e.text.trim().isEmpty || p.text.length < 8 ? null : () => Navigator.pop(context, [n.text.trim(), e.text.trim(), p.text, role]), child: const Text('Create User'))],
  );
}

class _AircraftDialog extends StatefulWidget { const _AircraftDialog(); @override State<_AircraftDialog> createState() => _AircraftDialogState(); }
class _AircraftDialogState extends State<_AircraftDialog> {
  final r = TextEditingController(), m = TextEditingController(), man = TextEditingController(); String status = 'ACTIVE';
  @override void dispose() { r.dispose(); m.dispose(); man.dispose(); super.dispose(); }
  @override Widget build(BuildContext context) => AlertDialog(
    title: const Text('Add Aircraft'), content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
      TextField(controller: r, decoration: const InputDecoration(labelText: 'Registration Number')), const SizedBox(height: 10),
      TextField(controller: m, decoration: const InputDecoration(labelText: 'Model')), const SizedBox(height: 10),
      TextField(controller: man, decoration: const InputDecoration(labelText: 'Manufacturer')), const SizedBox(height: 10),
      DropdownButtonFormField<String>(initialValue: status, decoration: const InputDecoration(labelText: 'Status'), items: const [DropdownMenuItem(value: 'ACTIVE', child: Text('ACTIVE')), DropdownMenuItem(value: 'INACTIVE', child: Text('INACTIVE'))], onChanged: (v) => setState(() => status = v!)),
    ])),
    actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')), FilledButton(onPressed: r.text.trim().isEmpty || m.text.trim().isEmpty || man.text.trim().isEmpty ? null : () => Navigator.pop(context, [r.text.trim(), m.text.trim(), man.text.trim(), status]), child: const Text('Create'))],
  );
}

class _MaintenanceDialog extends StatefulWidget {
  final List<Component> components;
  const _MaintenanceDialog({required this.components});
  @override State<_MaintenanceDialog> createState() => _MaintenanceDialogState();
}
class _MaintenanceDialogState extends State<_MaintenanceDialog> {
  late String component; final type = TextEditingController(), desc = TextEditingController(), parts = TextEditingController(); String result = 'PASSED';
  @override void initState() { super.initState(); component = '${widget.components.first.id}'; }
  @override void dispose() { type.dispose(); desc.dispose(); parts.dispose(); super.dispose(); }
  @override Widget build(BuildContext context) => AlertDialog(
    title: const Text('Log Maintenance'), content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
      DropdownButtonFormField<String>(initialValue: component, decoration: const InputDecoration(labelText: 'Component'), items: widget.components.map((c) => DropdownMenuItem(value: '${c.id}', child: Text(c.serial))).toList(), onChanged: (v) => setState(() => component = v!)), const SizedBox(height: 10),
      TextField(controller: type, decoration: const InputDecoration(labelText: 'Maintenance Type')), const SizedBox(height: 10),
      TextField(controller: desc, maxLines: 3, decoration: const InputDecoration(labelText: 'Description')), const SizedBox(height: 10),
      TextField(controller: parts, decoration: const InputDecoration(labelText: 'Parts Replaced')), const SizedBox(height: 10),
      DropdownButtonFormField<String>(initialValue: result, decoration: const InputDecoration(labelText: 'Inspection Result'), items: const [DropdownMenuItem(value: 'PASSED', child: Text('PASSED')), DropdownMenuItem(value: 'FAILED', child: Text('FAILED'))], onChanged: (v) => setState(() => result = v!)),
    ])),
    actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')), FilledButton(onPressed: type.text.trim().isEmpty || desc.text.trim().isEmpty ? null : () => Navigator.pop(context, [component, type.text.trim(), desc.text.trim(), parts.text.trim(), result]), child: const Text('Save Record'))],
  );
}
