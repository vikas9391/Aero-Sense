import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'screens.dart';

const bg = Color(0xFFF4F1EC);
const panel = Colors.white;
const accent = Color(0xFF34439B);
const muted = Color(0xFF77746F);
const line = Color(0xFFE4E0D9);
const good = Color(0xFF16856D);
const soft = Color(0xFFF8F6F2);

void main() => runApp(const AeroSenseApp());

class AeroSenseApp extends StatelessWidget {
  const AeroSenseApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Aero-Sense',
        theme: ThemeData(useMaterial3: true, scaffoldBackgroundColor: bg, colorScheme: ColorScheme.fromSeed(seedColor: accent, brightness: Brightness.light)),
        home: const SessionGate(),
      );
}

class SessionGate extends StatefulWidget {
  const SessionGate({super.key});
  @override State<SessionGate> createState() => _SessionGateState();
}
class _SessionGateState extends State<SessionGate> {
  String? token;
  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async { final t = await const FlutterSecureStorage().read(key: 'aero_sense_token'); if (mounted) setState(() => token = t); }
  @override Widget build(BuildContext context) => token == null ? const LoginScreen() : const AppShell();
}
