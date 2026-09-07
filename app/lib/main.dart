import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';

const bg = Color(0xFFF4F1EC);
const panel = Colors.white;
const accent = Color(0xFF34439B);
const textColor = Color(0xFF151515);
const muted = Color(0xFF77746F);
const line = Color(0xFFE4E0D9);
const good = Color(0xFF16856D);
const goodSoft = Color(0xFFE8F5F0);
const soft = Color(0xFFF8F6F2);

void main() => runApp(const AeroSenseApp());

class AeroSenseApp extends StatelessWidget {
  const AeroSenseApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Aero-Sense',
        theme: ThemeData(
          useMaterial3: true,
          scaffoldBackgroundColor: bg,
          colorScheme: ColorScheme.fromSeed(seedColor: accent, brightness: Brightness.light),
          fontFamily: 'sans',
        ),
        home: const SessionGate(),
      );
}

class SessionGate extends StatefulWidget {
  const SessionGate({super.key});
  @override State<SessionGate> createState() => _SessionGateState();
}
class _SessionGateState extends State<SessionGate> {
  final storage = const FlutterSecureStorage();
  bool loading = true;
  String? token;
  @override
  void initState() { super.initState(); _load(); }
  Future<void> _load() async { token = await storage.read(key: 'aero_sense_token'); if (mounted) setState(() => loading = false); }
  @override
  Widget build(BuildContext context) {
    if (loading) return const Splash();
    return token == null ? const LoginScreen() : const HomeShell();
  }
}

class Splash extends StatelessWidget {
  const Splash({super.key});
  @override Widget build(BuildContext context) => const Scaffold(body: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.verified_user_outlined, size: 42, color: accent), SizedBox(height: 16), Text('AERO-SENSE', style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800, letterSpacing: 2)), SizedBox(height: 5), Text('COMPONENT INTELLIGENCE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: muted, letterSpacing: 1.5)), SizedBox(height: 22), CircularProgressIndicator(color: accent)]));
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override State<LoginScreen> createState() => _LoginScreenState();
}
class _LoginScreenState extends State<LoginScreen> {
  final company = TextEditingController(); final email = TextEditingController(); final password = TextEditingController();
  bool busy = false; bool show = false;
  Future<void> login() async {
    if (company.text.trim().isEmpty || email.text.trim().isEmpty || password.text.isEmpty) { _message('Missing details', 'Enter company, email, and password.'); return; }
    setState(() => busy = true);
    try {
      final dio = Dio(BaseOptions(baseUrl: 'http://10.0.2.2:8080/api', connectTimeout: const Duration(seconds: 15)));
      final r = await dio.post('/auth/login', data: {'company_name': company.text.trim(), 'email': email.text.trim(), 'password': password.text});
      await const FlutterSecureStorage().write(key: 'aero_sense_token', value: r.data['token']);
      if (mounted) Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const HomeShell()), (_) => false);
    } on DioException catch (e) { _message('Sign in failed', e.response?.data?['message']?.toString() ?? 'Invalid credentials or server unavailable.'); }
    finally { if (mounted) setState(() => busy = false); }
  }
  void _message(String title, String body) => showDialog(context: context, builder: (_) => AlertDialog(title: Text(title), content: Text(body), actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK'))]));
  @override Widget build(BuildContext context) => Scaffold(body: SafeArea(child: SingleChildScrollView(padding: const EdgeInsets.all(24), child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 520), child: Column(children: [const SizedBox(height: 28), const Icon(Icons.verified_user_outlined, size: 54, color: accent), const SizedBox(height: 14), const Text('Aero-Sense', style: TextStyle(fontSize: 29, fontWeight: FontWeight.w800)), const Text('Aircraft component intelligence', style: TextStyle(color: muted)), const SizedBox(height: 25), Container(padding: const EdgeInsets.all(22), decoration: BoxDecoration(color: panel, borderRadius: BorderRadius.circular(30), border: Border.all(color: line)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Welcome back', style: TextStyle(fontSize: 25, fontWeight: FontWeight.w800)), const SizedBox(height: 4), const Text('Sign in to continue your operations', style: TextStyle(color: muted)), const SizedBox(height: 18), _field('Company', company, 'Your company'), _field('Email address', email, 'you@company.com', keyboard: TextInputType.emailAddress), const SizedBox(height: 14), const Text('PASSWORD', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: muted, letterSpacing: .8)), const SizedBox(height: 7), TextField(controller: password, obscureText: !show, decoration: InputDecoration(prefixIcon: const Icon(Icons.lock_outline), hintText: 'Enter your password', suffixIcon: IconButton(icon: Icon(show ? Icons.visibility_off_outlined : Icons.visibility_outlined), onPressed: () => setState(() => show = !show)), filled: true, fillColor: soft, border: OutlineInputBorder(borderRadius: BorderRadius.circular(17), borderSide: const BorderSide(color: line)))), const SizedBox(height: 12), Row(children: [const Icon(Icons.verified_user_outlined, color: good, size: 16), const SizedBox(width: 5), const Text('Secure session', style: TextStyle(color: good, fontSize: 11, fontWeight: FontWeight.w700)), const Spacer(), const Text('JWT protected', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w700))]), const SizedBox(height: 13), SizedBox(width: double.infinity, height: 54, child: FilledButton.icon(onPressed: busy ? null : login, icon: const Icon(Icons.login), label: Text(busy ? 'Signing in…' : 'Sign In'), style: FilledButton.styleFrom(backgroundColor: accent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(17))))), const SizedBox(height: 12), const Center(child: Text('Access is controlled by your Aero-Sense role.', style: TextStyle(color: muted, fontSize: 10)))]))]))));
  Widget _field(String label, TextEditingController c, String hint, {TextInputType? keyboard}) => Padding(padding: const EdgeInsets.only(bottom: 14), child: TextField(controller: c, keyboardType: keyboard, decoration: InputDecoration(labelText: label, hintText: hint, filled: true, fillColor: soft, border: OutlineInputBorder(borderRadius: BorderRadius.circular(17), borderSide: const BorderSide(color: line))));
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});
  @override State<HomeShell> createState() => _HomeShellState();
}
class _HomeShellState extends State<HomeShell> {
  int index = 0;
  final pages = const [HomeScreen(), PlaceholderPage(title: 'Components'), VerifyPage(), PlaceholderPage(title: 'Activity'), PlaceholderPage(title: 'Profile')];
  @override Widget build(BuildContext context) => Scaffold(body: SafeArea(child: pages[index]), bottomNavigationBar: NavigationBar(selectedIndex: index, onDestinationSelected: (i) => setState(() => index = i), backgroundColor: panel, destinations: const [NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'), NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Parts'), NavigationDestination(icon: Icon(Icons.nfc_outlined), selectedIcon: Icon(Icons.nfc), label: 'Verify'), NavigationDestination(icon: Icon(Icons.timeline_outlined), selectedIcon: Icon(Icons.timeline), label: 'Activity'), NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile')]));
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});
  @override Widget build(BuildContext context) => ListView(padding: const EdgeInsets.fromLTRB(22, 16, 22, 110), children: [const Text('OPERATIONS CONSOLE', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)), const SizedBox(height: 4), const Text('Aero-Sense', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)), const SizedBox(height: 4), const Text('Your fleet and component intelligence at a glance.', style: TextStyle(color: muted, fontSize: 14)), const SizedBox(height: 18), InkWell(onTap: () {}, borderRadius: BorderRadius.circular(28), child: Container(padding: const EdgeInsets.all(21), decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(28)), child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(Icons.nfc_outlined, color: Colors.white, size: 30), SizedBox(height: 20), Text('VERIFICATION CONTROL', style: TextStyle(color: Color(0xFFD9DCF8), fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1.3)), SizedBox(height: 4), Text('Verify an aircraft component', style: TextStyle(color: Colors.white, fontSize: 23, fontWeight: FontWeight.w800)), SizedBox(height: 7), Text('Scan an NFC tag and compare its digital identity with the secure backend record.', style: TextStyle(color: Color(0xFFE2E4F7), fontSize: 13, height: 1.45)), SizedBox(height: 17), Text('Start verification  ›', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800))]))), const SizedBox(height: 20), const Text('Overview', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)), const SizedBox(height: 12), Row(children: [_stat('Aircraft', Icons.flight_outlined), _stat('Components', Icons.inventory_2_outlined)]), const SizedBox(height: 12), Row(children: [_stat('Maintenance', Icons.build_outlined), _stat('Checks', Icons.fact_check_outlined)]), const SizedBox(height: 14), Container(padding: const EdgeInsets.all(17), decoration: BoxDecoration(color: panel, borderRadius: BorderRadius.circular(24), border: Border.all(color: line)), child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('VERIFICATION HEALTH', style: TextStyle(color: muted, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1.1)), SizedBox(height: 5), Row(children: [Expanded(child: Text('Backend verification status', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700))), Text('READY', style: TextStyle(color: good, fontWeight: FontWeight.w800))]), SizedBox(height: 12), LinearProgressIndicator(value: .0, minHeight: 8, borderRadius: BorderRadius.all(Radius.circular(4)), color: good, backgroundColor: soft)])]);
  static Widget _stat(String label, IconData icon) => Expanded(child: Container(margin: const EdgeInsets.only(right: 6), padding: const EdgeInsets.all(14), height: 118, decoration: BoxDecoration(color: panel, borderRadius: BorderRadius.circular(22), border: Border.all(color: line)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Container(width: 34, height: 34, decoration: BoxDecoration(color: const Color(0xFFECECF8), borderRadius: BorderRadius.circular(11)), child: Icon(icon, color: accent, size: 18)), Text('—', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)), Text(label, style: const TextStyle(color: muted, fontSize: 13))]));
}

class VerifyPage extends StatelessWidget {
  const VerifyPage({super.key});
  @override Widget build(BuildContext context) => ListView(padding: const EdgeInsets.fromLTRB(22, 18, 22, 110), children: [const Text('SECURE TAG CHECK', style: TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.3)), const SizedBox(height: 4), const Text('Verify', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)), const SizedBox(height: 4), const Text('Authenticate a component in seconds.', style: TextStyle(color: muted, fontSize: 14)), const SizedBox(height: 18), Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: panel, borderRadius: BorderRadius.circular(28), border: Border.all(color: line)), child: Column(children: [Container(width: 96, height: 96, decoration: BoxDecoration(color: const Color(0xFFECECF8), shape: BoxShape.circle, border: Border.all(color: const Color(0xFFD9D8E8))), child: const Icon(Icons.nfc_outlined, color: accent, size: 44)), const SizedBox(height: 16), const Text('READY TO VERIFY', style: TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)), const SizedBox(height: 6), const Text('Scan a component tag', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)), const SizedBox(height: 7), const Text('Hold your phone near the registered NFC tag to validate its digital identity against the backend.', textAlign: TextAlign.center, style: TextStyle(color: muted, height: 1.5)), const SizedBox(height: 16), SizedBox(width: double.infinity, height: 54, child: FilledButton.icon(onPressed: () {}, icon: const Icon(Icons.nfc), label: const Text('Start NFC scan'), style: FilledButton.styleFrom(backgroundColor: accent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(17)))))]))]);
}

class PlaceholderPage extends StatelessWidget { final String title; const PlaceholderPage({required this.title, super.key}); @override Widget build(BuildContext context) => Center(child: Text(title, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800))); }
