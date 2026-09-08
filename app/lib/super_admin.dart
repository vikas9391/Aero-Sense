import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'core/api.dart';
import 'theme.dart';
import 'widgets.dart';

final api = Api();

class CompanyManagementScreen extends StatefulWidget {
  const CompanyManagementScreen({super.key});
  @override State<CompanyManagementScreen> createState() => _CompanyManagementState();
}

class _CompanyManagementState extends State<CompanyManagementScreen> {
  List<CompanySummary> companies = [];
  bool loading = true;
  bool creatingCompany = false;
  String? error;

  Future<void> load({bool showLoader = true}) async {
    if (showLoader && mounted && companies.isEmpty) setState(() { loading = true; error = null; });
    try {
      await api.clearCache();
      final result = await api.companies();
      if (!mounted) return;
      setState(() { companies = result; loading = false; error = null; });
    } catch (e) {
      if (!mounted) return;
      setState(() { loading = false; error = api.errorMessage(e); });
    }
  }

  @override void initState() { super.initState(); load(); }

  Future<void> createCompany() async {
    if (creatingCompany || !mounted) return;
    final name = await _textDialog();
    if (!mounted || name == null || name.trim().isEmpty) return;
    setState(() { creatingCompany = true; error = null; });
    try {
      final created = await api.createCompany(name.trim());
      if (!mounted) return;
      final summary = CompanySummary(
        id: created.id, uuid: created.uuid, name: created.name, slug: created.slug,
        status: created.status, createdAt: created.createdAt, updatedAt: created.updatedAt,
        userCount: 0, aircraftCount: 0, componentCount: 0, maintenanceCount: 0, verificationCount: 0,
      );
      setState(() {
        companies = [summary, ...companies.where((c) => c.id != summary.id)];
        loading = false;
        creatingCompany = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Company created successfully.')));
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => creatingCompany = false);
      _message(api.errorMessage(e), error: true);
    }
  }

  Future<String?> _textDialog() {
    final controller = TextEditingController();
    final dialogFuture = showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Onboard New Company'),
        content: TextField(
          controller: controller, autofocus: true, textInputAction: TextInputAction.done,
          onSubmitted: (value) { if (value.trim().isNotEmpty) Navigator.of(dialogContext).pop(value); },
          decoration: const InputDecoration(labelText: 'Company Name', hintText: 'e.g. Falcon Airlines'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(), child: const Text('Cancel')),
          FilledButton(onPressed: () { final value = controller.text.trim(); if (value.isNotEmpty) Navigator.of(dialogContext).pop(value); }, child: const Text('Create Company')),
        ],
      ),
    );

    // The dialog route may still rebuild its TextField during the pop animation.
    // Dispose only after that transition has completed, not when showDialog's
    // Future completes.
    return dialogFuture.then((value) {
      Future<void>.delayed(const Duration(seconds: 1), controller.dispose);
      return value;
    });
  }

  Future<void> addAdmin(CompanySummary company) async {
    final values = await showDialog<List<String>>(context: context, builder: (_) => _AdminDialog(company: company));
    if (!mounted || values == null) return;
    try { await api.createCompanyAdmin(company.id, values[0], values[1], values[2]); await load(showLoader: false); if (mounted) _message('Company admin created successfully.'); }
    catch (e) { if (mounted) _message(api.errorMessage(e), error: true); }
  }

  Future<void> toggleStatus(CompanySummary company) async {
    final next = company.status == 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    final confirmed = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: Text(next == 'ACTIVE' ? 'Reactivate company?' : 'Suspend company?'),
      content: Text(next == 'ACTIVE' ? 'Users of ${company.name} will be able to sign in again.' : 'Users of ${company.name} will be blocked from signing in. Company data will remain untouched.'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(next == 'ACTIVE' ? 'Reactivate' : 'Suspend'))],
    ));
    if (!mounted || confirmed != true) return;
    try { await api.updateCompanyStatus(company.id, next); await load(showLoader: false); }
    catch (e) { if (mounted) _message(api.errorMessage(e), error: true); }
  }

  void _message(String text, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text), backgroundColor: error ? Colors.red : null));
  }

  @override Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: () => load(showLoader: false),
    child: ListView(padding: const EdgeInsets.fromLTRB(20, 18, 20, 110), children: [
      const Text('PLATFORM ADMINISTRATION', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
      const SizedBox(height: 4),
      Row(children: [
        const Expanded(child: Text('Companies', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800))),
        IconButton.filled(onPressed: creatingCompany ? null : createCompany, icon: creatingCompany ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.add_business_outlined), tooltip: 'Onboard company'),
      ]),
      const SizedBox(height: 5),
      const Text('Onboard companies, provision their first admin, view employees and control tenant access.', style: TextStyle(color: muted, height: 1.4)),
      const SizedBox(height: 18),
      if (error != null) CardBox(child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(child: Text(error!, style: const TextStyle(color: Colors.red))), IconButton(onPressed: () => load(showLoader: false), icon: const Icon(Icons.refresh))])),
      if (loading) const Padding(padding: EdgeInsets.all(30), child: Center(child: CircularProgressIndicator(color: accent)))
      else if (companies.isEmpty) CardBox(child: Column(children: [
        const Icon(Icons.business_outlined, size: 42, color: muted), const SizedBox(height: 12),
        const Text('No companies yet', style: TextStyle(fontWeight: FontWeight.w800)), const SizedBox(height: 5),
        const Text('Create the first company to get started.', style: TextStyle(color: muted)), const SizedBox(height: 14),
        FilledButton.icon(onPressed: creatingCompany ? null : createCompany, icon: const Icon(Icons.add), label: const Text('Create Company')),
      ]))
      else ...companies.map(_companyCard),
    ]),
  );

  Widget _companyCard(CompanySummary c) {
    final active = c.status == 'ACTIVE';
    return CardBox(margin: const EdgeInsets.only(bottom: 12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(width: 46, height: 46, decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(14)), child: const Icon(Icons.business_outlined, color: accent)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(c.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)), Text(c.slug, style: const TextStyle(color: muted, fontSize: 11))])),
        StatusPill(c.status),
      ]),
      const SizedBox(height: 15),
      Wrap(spacing: 12, runSpacing: 9, children: [
        _metric(Icons.people_outline, '${c.userCount} users'), _metric(Icons.flight_outlined, '${c.aircraftCount} aircraft'),
        _metric(Icons.memory_outlined, '${c.componentCount} components'), _metric(Icons.build_outlined, '${c.maintenanceCount} records'),
        _metric(Icons.nfc_outlined, '${c.verificationCount} scans'),
      ]),
      const Divider(height: 24),
      LayoutBuilder(builder: (context, constraints) {
        final compact = constraints.maxWidth < 430;
        final view = OutlinedButton.icon(onPressed: () => context.go('/company-detail', extra: c), icon: const Icon(Icons.visibility_outlined), label: const Text('View Company'));
        final admin = FilledButton.icon(onPressed: () => addAdmin(c), icon: const Icon(Icons.person_add_alt_1), label: const Text('Add Admin'));
        return compact ? Column(children: [SizedBox(width: double.infinity, child: view), const SizedBox(height: 8), SizedBox(width: double.infinity, child: admin)]) : Row(children: [Expanded(child: view), const SizedBox(width: 8), Expanded(child: admin)]);
      }),
      const SizedBox(height: 8),
      SizedBox(width: double.infinity, child: TextButton.icon(onPressed: () => toggleStatus(c), icon: Icon(active ? Icons.block_outlined : Icons.play_arrow_outlined), label: Text(active ? 'Suspend Company' : 'Reactivate Company'))),
    ]));
  }

  Widget _metric(IconData icon, String text) => Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 15, color: muted), const SizedBox(width: 5), Text(text, style: const TextStyle(color: muted, fontSize: 12))]);
}

class CompanyDetailScreen extends StatefulWidget {
  final CompanySummary company;
  const CompanyDetailScreen({required this.company, super.key});
  @override State<CompanyDetailScreen> createState() => _CompanyDetailState();
}

class _CompanyDetailState extends State<CompanyDetailScreen> {
  late CompanySummary company;
  List<User> users = [];
  bool loading = true;
  String? error;
  @override void initState() { super.initState(); company = widget.company; load(); }
  Future<void> load() async {
    try {
      await api.clearCache();
      final values = await Future.wait([api.company(widget.company.id), api.companyUsers(widget.company.id)]);
      if (!mounted) return;
      setState(() { company = values[0] as CompanySummary; users = values[1] as List<User>; error = null; });
    } catch (e) { if (mounted) setState(() => error = api.errorMessage(e)); }
    finally { if (mounted) setState(() => loading = false); }
  }
  @override Widget build(BuildContext context) {
    final active = company.status == 'ACTIVE';
    return ListView(padding: const EdgeInsets.fromLTRB(20, 18, 20, 110), children: [
      if (error != null) CardBox(child: Text(error!, style: const TextStyle(color: Colors.red))),
      CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [Container(width: 52, height: 52, decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(15)), child: const Icon(Icons.business_outlined, color: accent, size: 28)), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(company.name, style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800)), Text(company.slug, style: const TextStyle(color: muted, fontSize: 11))])), StatusPill(company.status)]),
        const SizedBox(height: 18),
        Wrap(spacing: 14, runSpacing: 10, children: [_metric(Icons.people_outline, '${company.userCount} users'), _metric(Icons.flight_outlined, '${company.aircraftCount} aircraft'), _metric(Icons.memory_outlined, '${company.componentCount} components'), _metric(Icons.build_outlined, '${company.maintenanceCount} records'), _metric(Icons.nfc_outlined, '${company.verificationCount} scans')]),
        const SizedBox(height: 18),
        SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: () async { try { await api.updateCompanyStatus(company.id, active ? 'SUSPENDED' : 'ACTIVE'); await load(); } catch (e) { if (mounted) setState(() => error = api.errorMessage(e)); } }, icon: Icon(active ? Icons.block_outlined : Icons.play_arrow_outlined), label: Text(active ? 'Suspend Company' : 'Reactivate Company'))),
      ])),
      const SizedBox(height: 14),
      CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Employees & Accounts', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
        const SizedBox(height: 5), Text('${users.length} account${users.length == 1 ? '' : 's'} in ${company.name}', style: const TextStyle(color: muted)),
        const SizedBox(height: 14),
        if (loading) const Center(child: CircularProgressIndicator(color: accent)) else if (users.isEmpty) const Text('No users yet. Use Add Admin from Company Management.', style: TextStyle(color: muted)) else ...users.map((u) => Padding(padding: const EdgeInsets.only(bottom: 12), child: ListTile(contentPadding: EdgeInsets.zero, leading: CircleAvatar(backgroundColor: soft, child: const Icon(Icons.person_outline, color: accent)), title: Text(u.name, style: const TextStyle(fontWeight: FontWeight.w700)), subtitle: Text(u.email, style: const TextStyle(color: muted)), trailing: StatusPill(u.role)))),
      ])),
    ]);
  }
  Widget _metric(IconData icon, String text) => Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 15, color: muted), const SizedBox(width: 5), Text(text, style: const TextStyle(color: muted, fontSize: 12))]);
}

class _AdminDialog extends StatefulWidget {
  final CompanySummary company;
  const _AdminDialog({required this.company, super.key});
  @override State<_AdminDialog> createState() => _AdminDialogState();
}
class _AdminDialogState extends State<_AdminDialog> {
  final name = TextEditingController(); final email = TextEditingController(); final password = TextEditingController();
  bool obscure = true;
  bool get canSubmit => name.text.trim().isNotEmpty && email.text.trim().isNotEmpty && password.text.length >= 8;
  @override void dispose() { name.dispose(); email.dispose(); password.dispose(); super.dispose(); }
  void refresh() { if (mounted) setState(() {}); }
  @override Widget build(BuildContext context) => AlertDialog(
    title: Text('Add Admin — ${widget.company.name}'),
    content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
      TextField(controller: name, onChanged: (_) => refresh(), decoration: const InputDecoration(labelText: 'Full Name')),
      const SizedBox(height: 12), TextField(controller: email, onChanged: (_) => refresh(), keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
      const SizedBox(height: 12), TextField(controller: password, onChanged: (_) => refresh(), obscureText: obscure, decoration: InputDecoration(labelText: 'Password', hintText: 'Minimum 8 characters', suffixIcon: IconButton(onPressed: () => setState(() => obscure = !obscure), icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined)))),
    ])),
    actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')), FilledButton(onPressed: canSubmit ? () => Navigator.pop(context, [name.text.trim(), email.text.trim(), password.text]) : null, child: const Text('Create Admin'))],
  );
}
