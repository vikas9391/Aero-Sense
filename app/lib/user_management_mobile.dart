import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import 'core/api.dart';
import 'theme.dart';
import 'widgets.dart';

const mobileManageableRoles = <String>[
  'COMPANY_ADMIN',
  'MANUFACTURER',
  'MAINTENANCE_TECHNICIAN',
  'INSPECTOR',
  'VIEWER',
];

class MobileManagedUser {
  final int id;
  final String uuid, name, email, role, status, createdAt;
  final int? companyId;
  const MobileManagedUser({required this.id, required this.uuid, required this.name, required this.email, required this.role, required this.status, required this.createdAt, this.companyId});
  factory MobileManagedUser.fromJson(Map<String, dynamic> j) => MobileManagedUser(
    id: j['id'] ?? 0, uuid: j['uuid'] ?? '', name: j['name'] ?? '', email: j['email'] ?? '',
    role: (j['role'] ?? 'VIEWER').toString().toUpperCase(), status: (j['status'] ?? 'ACTIVE').toString().toUpperCase(),
    createdAt: j['created_at'] ?? '', companyId: j['company_id'],
  );
}

class MobileUserProfile {
  final MobileManagedUser user;
  final String? companyName;
  final int maintenanceCount, componentUpdateCount;
  const MobileUserProfile({required this.user, this.companyName, required this.maintenanceCount, required this.componentUpdateCount});
  factory MobileUserProfile.fromJson(Map<String, dynamic> j) => MobileUserProfile(
    user: MobileManagedUser.fromJson(Map<String, dynamic>.from(j['user'] ?? {})),
    companyName: j['company_name'], maintenanceCount: j['maintenance_count'] ?? 0, componentUpdateCount: j['component_update_count'] ?? 0,
  );
}

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});
  @override State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  final api = Api();
  List<MobileManagedUser> users = [];
  MobileManagedUser? me;
  bool loading = true;
  String? error;

  @override void initState() { super.initState(); load(); }
  Future<void> load() async {
    if (mounted) setState(() { loading = true; error = null; });
    try {
      final responses = await Future.wait([api.dio.get('/users'), api.dio.get('/auth/me')]);
      users = _list(responses[0].data).map(MobileManagedUser.fromJson).toList();
      me = MobileManagedUser.fromJson(Map<String, dynamic>.from(responses[1].data));
    } catch (e) { error = api.errorMessage(e); }
    if (mounted) setState(() => loading = false);
  }

  List<Map<String, dynamic>> _list(dynamic data) => data is List ? data.map((e) => Map<String, dynamic>.from(e as Map)).toList() : [];

  Future<void> changeRole(MobileManagedUser user) async {
    var selected = user.role;
    final role = await showDialog<String>(context: context, builder: (_) => StatefulBuilder(builder: (context, setDialog) => AlertDialog(
      title: const Text('Change Role'),
      content: DropdownButtonFormField<String>(value: selected, isExpanded: true, decoration: const InputDecoration(labelText: 'New role'), items: mobileManageableRoles.map((r) => DropdownMenuItem(value: r, child: Text(_roleLabel(r)))).toList(), onChanged: (v) { if (v != null) setDialog(() => selected = v); }),
      actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(context, selected), child: const Text('Continue'))],
    )));
    if (role == null || role == user.role) return;
    final confirmed = await _confirm('Change ${user.name}\'s role?', 'This account will immediately use ${_roleLabel(role)} permissions on its next authenticated request.');
    if (!confirmed) return;
    try { await api.dio.put('/users/${user.id}/role', data: {'role': role}); await load(); _message('Role updated to ${_roleLabel(role)}.'); }
    catch (e) { _message(api.errorMessage(e), error: true); }
  }

  Future<void> setStatus(MobileManagedUser user, String status) async {
    final label = status == 'ACTIVE' ? 'Reactivate' : status == 'SUSPENDED' ? 'Suspend' : 'Delete';
    final confirmed = await _confirm('$label ${user.name}?', status == 'DELETED' ? 'The account will be soft-deleted. Work history and audit records are preserved.' : status == 'SUSPENDED' ? 'The account will no longer be able to sign in.' : 'The account will be allowed to sign in again.');
    if (!confirmed) return;
    try { await api.dio.put('/users/${user.id}/status', data: {'status': status}); await load(); _message('Account ${status.toLowerCase()}.'); }
    catch (e) { _message(api.errorMessage(e), error: true); }
  }

  Future<void> viewProfile(MobileManagedUser user) async {
    try {
      final response = await api.dio.get('/users/${user.id}');
      final p = MobileUserProfile.fromJson(Map<String, dynamic>.from(response.data));
      if (!mounted) return;
      showDialog(context: context, builder: (_) => AlertDialog(
        title: Row(children: [CircleAvatar(backgroundColor: soft, child: const Icon(Icons.person_outline, color: accent)), const SizedBox(width: 12), Expanded(child: Text(p.user.name))]),
        content: SingleChildScrollView(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _detail('Email', p.user.email), _detail('Role', _roleLabel(p.user.role)), _detail('Status', p.user.status), _detail('Company', p.companyName ?? 'Platform'),
          const Divider(height: 24), _detail('Maintenance records', '${p.maintenanceCount}'), _detail('Component updates', '${p.componentUpdateCount}'),
        ])),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))],
      ));
    } catch (e) { _message(api.errorMessage(e), error: true); }
  }

  Widget _detail(String title, String value) => Padding(padding: const EdgeInsets.only(bottom: 10), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [SizedBox(width: 130, child: Text(title, style: const TextStyle(color: muted, fontSize: 12))), Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w700)))]));

  Future<bool> _confirm(String title, String body) async => await showDialog<bool>(context: context, builder: (_) => AlertDialog(title: Text(title), content: Text(body), actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Confirm'))])) ?? false;
  void _message(String text, {bool error = false}) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text), backgroundColor: error ? Colors.red : null)); }

  Widget _menu(MobileManagedUser user) => PopupMenuButton<String>(icon: const Icon(Icons.more_horiz), onSelected: (action) { switch (action) { case 'profile': viewProfile(user); case 'role': changeRole(user); case 'suspend': setStatus(user, 'SUSPENDED'); case 'reactivate': setStatus(user, 'ACTIVE'); case 'delete': setStatus(user, 'DELETED'); } }, itemBuilder: (_) => [
    const PopupMenuItem(value: 'profile', child: ListTile(contentPadding: EdgeInsets.zero, leading: Icon(Icons.person_search_outlined), title: Text('View profile & work')),
    const PopupMenuItem(value: 'role', child: ListTile(contentPadding: EdgeInsets.zero, leading: Icon(Icons.manage_accounts_outlined), title: Text('Change role')),
    if (user.status == 'ACTIVE') const PopupMenuItem(value: 'suspend', child: ListTile(contentPadding: EdgeInsets.zero, leading: Icon(Icons.pause_circle_outline), title: Text('Suspend account')),
    if (user.status == 'SUSPENDED') const PopupMenuItem(value: 'reactivate', child: ListTile(contentPadding: EdgeInsets.zero, leading: Icon(Icons.play_circle_outline), title: Text('Reactivate account')),
    if (user.status != 'DELETED') const PopupMenuItem(value: 'delete', child: ListTile(contentPadding: EdgeInsets.zero, leading: Icon(Icons.delete_outline), title: Text('Delete account')),
  ]);

  @override Widget build(BuildContext context) => RefreshIndicator(onRefresh: load, child: ListView(padding: const EdgeInsets.fromLTRB(20, 18, 20, 110), children: [
    const Text('COMPANY ADMINISTRATION', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)),
    const SizedBox(height: 4), const Text('Users & Roles', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800)),
    const SizedBox(height: 5), const Text('Manage employee access, roles and account status from the mobile app.', style: TextStyle(color: muted, height: 1.4)), const SizedBox(height: 18),
    if (error != null) CardBox(child: Text(error!, style: const TextStyle(color: Colors.red))),
    if (loading) const Padding(padding: EdgeInsets.all(30), child: Center(child: CircularProgressIndicator(color: accent)))
    else if (users.isEmpty) const CardBox(child: Text('No users found.', style: TextStyle(color: muted)))
    else ...users.map((u) => _userCard(u)),
  ]));

  Widget _userCard(MobileManagedUser u) { final self = me?.id == u.id; final locked = u.role == 'SUPER_ADMIN' || self; return CardBox(margin: const EdgeInsets.only(bottom: 12), child: Row(children: [CircleAvatar(radius: 23, backgroundColor: soft, child: const Icon(Icons.person_outline, color: accent)), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(u.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)), const SizedBox(height: 3), Text(u.email, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: muted, fontSize: 12)), const SizedBox(height: 7), Wrap(spacing: 6, runSpacing: 5, children: [StatusPill(u.role), StatusPill(u.status)])])), if (!locked) _menu(u)])); }
}

class CompanyUsersManagementScreen extends StatefulWidget {
  final CompanySummary company;
  const CompanyUsersManagementScreen({required this.company, super.key});
  @override State<CompanyUsersManagementScreen> createState() => _CompanyUsersManagementState();
}

class _CompanyUsersManagementState extends State<CompanyUsersManagementScreen> {
  final api = Api();
  List<MobileManagedUser> users = [];
  bool loading = true;
  String? error;
  @override void initState() { super.initState(); load(); }
  Future<void> load() async { if (mounted) setState(() { loading = true; error = null; }); try { users = (await api.dio.get('/companies/${widget.company.id}/users')).data is List ? ((await api.dio.get('/companies/${widget.company.id}/users')).data as List).map((e) => MobileManagedUser.fromJson(Map<String,dynamic>.from(e))).toList() : []; } catch (e) { error = api.errorMessage(e); } if (mounted) setState(() => loading = false); }

  Future<void> action(MobileManagedUser user, String action) async {
    try {
      if (action == 'profile') {
        final p = MobileUserProfile.fromJson(Map<String,dynamic>.from((await api.dio.get('/users/${user.id}')).data));
        if (mounted) showDialog(context: context, builder: (_) => AlertDialog(title: Text(p.user.name), content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [_line('Email', p.user.email), _line('Role', _roleLabel(p.user.role)), _line('Status', p.user.status), _line('Company', p.companyName ?? widget.company.name), _line('Maintenance', '${p.maintenanceCount}'), _line('Component updates', '${p.componentUpdateCount}')]), actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))]));
        return;
      }
      if (action == 'role') { await _changeRole(user); return; }
      final status = action == 'suspend' ? 'SUSPENDED' : action == 'reactivate' ? 'ACTIVE' : 'DELETED';
      final ok = await _confirm(status == 'DELETED' ? 'Delete ${user.name}?' : status == 'SUSPENDED' ? 'Suspend ${user.name}?' : 'Reactivate ${user.name}?');
      if (!ok) return;
      await api.dio.put('/users/${user.id}/status', data: {'status': status}); await load();
    } catch (e) { if (mounted) _message(api.errorMessage(e), error: true); }
  }
  Widget _line(String a, String b) => Padding(padding: const EdgeInsets.only(bottom: 9), child: Row(children: [SizedBox(width: 115, child: Text(a, style: const TextStyle(color: muted))), Expanded(child: Text(b, style: const TextStyle(fontWeight: FontWeight.w700)))]));
  Future<bool> _confirm(String title) async => await showDialog<bool>(context: context, builder: (_) => AlertDialog(title: Text(title), content: const Text('This change will take effect immediately.'), actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Confirm'))])) ?? false;
  Future<void> _changeRole(MobileManagedUser u) async { var role = u.role; final result = await showDialog<String>(context: context, builder: (_) => StatefulBuilder(builder: (context,set) => AlertDialog(title: const Text('Change Role'), content: DropdownButtonFormField<String>(value: role, isExpanded: true, items: mobileManageableRoles.map((r)=>DropdownMenuItem(value:r,child:Text(_roleLabel(r)))).toList(), onChanged:(v){if(v!=null)set(()=>role=v);}), actions:[TextButton(onPressed:()=>Navigator.pop(context),child:const Text('Cancel')),FilledButton(onPressed:()=>Navigator.pop(context,role),child:const Text('Save'))]))); if(result==null||result==u.role)return; final ok=await _confirm('Change ${u.name}\'s role to ${_roleLabel(result)}?'); if(!ok)return; await api.dio.put('/users/${u.id}/role',data:{'role':result}); await load(); }
  void _message(String t,{bool error=false})=>ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:Text(t),backgroundColor:error?Colors.red:null));
  @override Widget build(BuildContext context)=>RefreshIndicator(onRefresh:load,child:ListView(padding:const EdgeInsets.fromLTRB(20,18,20,110),children:[CardBox(child:Row(children:[Container(width:48,height:48,decoration:BoxDecoration(color:soft,borderRadius:BorderRadius.circular(14)),child:const Icon(Icons.business_outlined,color:accent)),const SizedBox(width:12),Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text(widget.company.name,style:const TextStyle(fontSize:20,fontWeight:FontWeight.w800)),Text(widget.company.slug,style:const TextStyle(color:muted,fontSize:11))])),StatusPill(widget.company.status)])),const SizedBox(height:14),const Text('Users & Roles',style:TextStyle(fontSize:21,fontWeight:FontWeight.w800)),const SizedBox(height:5),Text('Super Admin controls for ${widget.company.name}',style:const TextStyle(color:muted)),const SizedBox(height:14),if(error!=null)CardBox(child:Text(error!,style:const TextStyle(color:Colors.red))),if(loading)const Center(child:Padding(padding:EdgeInsets.all(30),child:CircularProgressIndicator(color:accent)))else if(users.isEmpty)const CardBox(child:Text('No users in this company.',style:TextStyle(color:muted)))else...users.map((u)=>CardBox(margin:const EdgeInsets.only(bottom:12),child:Row(children:[CircleAvatar(backgroundColor:soft,child:const Icon(Icons.person_outline,color:accent)),const SizedBox(width:12),Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text(u.name,style:const TextStyle(fontWeight:FontWeight.w800)),Text(u.email,style:const TextStyle(color:muted,fontSize:12)),const SizedBox(height:6),Wrap(spacing:6,children:[StatusPill(u.role),StatusPill(u.status)])])),if(u.role!='SUPER_ADMIN')PopupMenuButton<String>(icon:const Icon(Icons.more_horiz),onSelected:(a)=>action(u,a),itemBuilder:(_)=>[const PopupMenuItem(value:'profile',child:Text('View profile & work')),const PopupMenuItem(value:'role',child:Text('Change role')),if(u.status=='ACTIVE')const PopupMenuItem(value:'suspend',child:Text('Suspend account')),if(u.status=='SUSPENDED')const PopupMenuItem(value:'reactivate',child:Text('Reactivate account')),if(u.status!='DELETED')const PopupMenuItem(value:'delete',child:Text('Delete account'))])])))]));
}

String _roleLabel(String role) => role.replaceAll('_', ' ').toLowerCase().split(' ').map((s) => s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}').join(' ');
