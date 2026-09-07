import 'package:flutter/material.dart';

import 'core/api.dart';
import 'theme.dart';
import 'widgets.dart';

final api = Api();

class CompanyManagementScreen extends StatefulWidget {
  const CompanyManagementScreen({super.key});

  @override
  State<CompanyManagementScreen> createState() => _CompanyManagementState();
}

class _CompanyManagementState extends State<CompanyManagementScreen> {
  List<CompanySummary> companies = [];
  bool loading = true;
  String? error;

  Future<void> load() async {
    if (mounted) setState(() { loading = true; error = null; });
    try {
      companies = await api.companies();
    } catch (e) {
      error = api.errorMessage(e);
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> createCompany() async {
    final name = await _textDialog(
      title: 'Onboard New Company',
      label: 'Company Name',
      hint: 'e.g. Falcon Airlines',
    );
    if (name == null || name.trim().isEmpty) return;
    try {
      await api.createCompany(name.trim());
      await load();
      if (mounted) _message('Company created successfully.');
    } catch (e) {
      if (mounted) _message(api.errorMessage(e), error: true);
    }
  }

  Future<void> addAdmin(CompanySummary company) async {
    final values = await showDialog<List<String>>(
      context: context,
      builder: (_) => _AdminDialog(company: company),
    );
    if (values == null) return;
    try {
      await api.createCompanyAdmin(company.id, values[0], values[1], values[2]);
      await load();
      if (mounted) _message('Company admin created successfully.');
    } catch (e) {
      if (mounted) _message(api.errorMessage(e), error: true);
    }
  }

  Future<void> toggleStatus(CompanySummary company) async {
    final next = company.status == 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(next == 'ACTIVE' ? 'Reactivate company?' : 'Suspend company?'),
        content: Text(
          next == 'ACTIVE'
              ? 'Users of ${company.name} will be able to sign in again.'
              : 'Users of ${company.name} will be blocked from signing in. Company data will remain untouched.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(next == 'ACTIVE' ? 'Reactivate' : 'Suspend')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await api.updateCompanyStatus(company.id, next);
      await load();
    } catch (e) {
      if (mounted) _message(api.errorMessage(e), error: true);
    }
  }

  Future<String?> _textDialog({required String title, required String label, required String hint}) {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(title),
        content: TextField(controller: controller, autofocus: true, decoration: InputDecoration(labelText: label, hintText: hint)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, controller.text), child: const Text('Create Company')),
        ],
      ),
    );
  }

  void _message(String text, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text), backgroundColor: error ? Colors.red : null));
  }

  @override
  Widget build(BuildContext context) => RefreshIndicator(
        onRefresh: load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
          children: [
            const Text('PLATFORM ADMINISTRATION', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
            const SizedBox(height: 4),
            Row(children: [
              const Expanded(child: Text('Companies', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800))),
              IconButton.filled(onPressed: createCompany, icon: const Icon(Icons.add_business_outlined), tooltip: 'Onboard company'),
            ]),
            const SizedBox(height: 5),
            const Text('Onboard companies, provision their first admin, view employees and control tenant access.', style: TextStyle(color: muted)),
            const SizedBox(height: 18),
            if (error != null) CardBox(child: Text(error!, style: const TextStyle(color: Colors.red))),
            if (loading)
              const Padding(padding: EdgeInsets.all(30), child: Center(child: CircularProgressIndicator(color: accent)))
            else if (companies.isEmpty)
              CardBox(
                child: Column(children: [
                  const Icon(Icons.business_outlined, size: 42, color: muted),
                  const SizedBox(height: 12),
                  const Text('No companies yet', style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 5),
                  const Text('Create the first company to get started.', style: TextStyle(color: muted)),
                  const SizedBox(height: 14),
                  FilledButton.icon(onPressed: createCompany, icon: const Icon(Icons.add), label: const Text('Create Company')),
                ]),
              )
            else
              ...companies.map(_companyCard),
          ],
        ),
      );

  Widget _companyCard(CompanySummary c) {
    final active = c.status == 'ACTIVE';
    return CardBox(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(width: 46, height: 46, decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(14)), child: const Icon(Icons.business_outlined, color: accent)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(c.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)), Text(c.slug, style: const TextStyle(color: muted, fontSize: 11))])),
            StatusPill(c.status),
          ]),
          const SizedBox(height: 15),
          Wrap(spacing: 12, runSpacing: 9, children: [
            _metric(Icons.people_outline, '${c.userCount} users'),
            _metric(Icons.flight_outlined, '${c.aircraftCount} aircraft'),
            _metric(Icons.memory_outlined, '${c.componentCount} components'),
            _metric(Icons.build_outlined, '${c.maintenanceCount} records'),
            _metric(Icons.nfc_outlined, '${c.verificationCount} scans'),
          ]),
          const Divider(height: 24),
          Row(children: [
            Expanded(child: OutlinedButton.icon(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CompanyDetailScreen(company: c))).then((_) => load()), icon: const Icon(Icons.visibility_outlined), label: const Text('View Company'))),
            const SizedBox(width: 8),
            Expanded(child: FilledButton.icon(onPressed: () => addAdmin(c), icon: const Icon(Icons.person_add_alt_1), label: const Text('Add Admin'))),
          ]),
          const SizedBox(height: 8),
          SizedBox(width: double.infinity, child: TextButton.icon(onPressed: () => toggleStatus(c), icon: Icon(active ? Icons.block_outlined : Icons.play_arrow_outlined), label: Text(active ? 'Suspend Company' : 'Reactivate Company'))),
        ],
      ),
    );
  }

  Widget _metric(IconData icon, String text) => Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 15, color: muted), const SizedBox(width: 5), Text(text, style: const TextStyle(color: muted, fontSize: 12))]);
}

class CompanyDetailScreen extends StatefulWidget {
  final CompanySummary company;
  const CompanyDetailScreen({required this.company, super.key});

  @override
  State<CompanyDetailScreen> createState() => _CompanyDetailState();
}

class _CompanyDetailState extends State<CompanyDetailScreen> {
  late CompanySummary company;
  List<User> users = [];
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    company = widget.company;
    load();
  }

  Future<void> load() async {
    try {
      final values = await Future.wait([api.company(widget.company.id), api.companyUsers(widget.company.id)]);
      company = values[0] as CompanySummary;
      users = values[1] as List<User>;
    } catch (e) {
      error = api.errorMessage(e);
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final active = company.status == 'ACTIVE';
    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(title: const Text('Company details'), backgroundColor: bg),
      body: RefreshIndicator(
        onRefresh: load,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            if (error != null) CardBox(child: Text(error!, style: const TextStyle(color: Colors.red))),
            CardBox(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Container(width: 52, height: 52, decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(15)), child: const Icon(Icons.business_outlined, color: accent, size: 28)),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(company.name, style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800)), Text(company.slug, style: const TextStyle(color: muted, fontSize: 11))])),
                  StatusPill(company.status),
                ]),
                const SizedBox(height: 18),
                Wrap(spacing: 14, runSpacing: 10, children: [
                  _metric(Icons.people_outline, '${company.userCount} users'),
                  _metric(Icons.flight_outlined, '${company.aircraftCount} aircraft'),
                  _metric(Icons.memory_outlined, '${company.componentCount} components'),
                  _metric(Icons.build_outlined, '${company.maintenanceCount} records'),
                  _metric(Icons.nfc_outlined, '${company.verificationCount} scans'),
                ]),
                const SizedBox(height: 18),
                SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: () async { await api.updateCompanyStatus(company.id, active ? 'SUSPENDED' : 'ACTIVE'); await load(); }, icon: Icon(active ? Icons.block_outlined : Icons.play_arrow_outlined), label: Text(active ? 'Suspend Company' : 'Reactivate Company'))),
              ]),
            ),
            const SizedBox(height: 14),
            CardBox(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Employees & Accounts', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 5),
                Text('${users.length} account${users.length == 1 ? '' : 's'} in ${company.name}', style: const TextStyle(color: muted)),
                const SizedBox(height: 14),
                if (loading)
                  const Center(child: CircularProgressIndicator(color: accent))
                else if (users.isEmpty)
                  const Text('No users yet. Use Add Admin from Company Management.', style: TextStyle(color: muted))
                else
                  ...users.map((u) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(backgroundColor: soft, child: const Icon(Icons.person_outline, color: accent)),
                          title: Text(u.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text(u.email, style: const TextStyle(color: muted)),
                          trailing: StatusPill(u.role),
                        ),
                      )),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _metric(IconData icon, String text) => Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 15, color: muted), const SizedBox(width: 5), Text(text, style: const TextStyle(color: muted, fontSize: 12))]);
}

class _AdminDialog extends StatefulWidget {
  final CompanySummary company;
  const _AdminDialog({required this.company});

  @override
  State<_AdminDialog> createState() => _AdminDialogState();
}

class _AdminDialogState extends State<_AdminDialog> {
  final name = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  bool obscure = true;

  @override
  void dispose() {
    name.dispose();
    email.dispose();
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
        title: Text('Add Admin — ${widget.company.name}'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: name, decoration: const InputDecoration(labelText: 'Full Name')),
            const SizedBox(height: 12),
            TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
            const SizedBox(height: 12),
            TextField(controller: password, obscureText: obscure, decoration: InputDecoration(labelText: 'Password', hintText: 'Minimum 8 characters', suffixIcon: IconButton(onPressed: () => setState(() => obscure = !obscure), icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined)))),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(onPressed: () { if (name.text.trim().isEmpty || email.text.trim().isEmpty || password.text.length < 8) return; Navigator.pop(context, [name.text.trim(), email.text.trim(), password.text]); }, child: const Text('Create Admin')),
        ],
      );
}
