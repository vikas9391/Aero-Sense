import 'package:flutter/material.dart';
import 'core/api.dart';
import 'screens.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AeroSenseApp());
}

class AeroSenseApp extends StatelessWidget {
  const AeroSenseApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Aero-Sense',
        theme: ThemeData(
          useMaterial3: true,
          scaffoldBackgroundColor: bg,
          colorScheme: ColorScheme.fromSeed(seedColor: accent),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: soft,
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(17),
                borderSide: const BorderSide(color: line)),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(17),
                borderSide: const BorderSide(color: line)),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(17),
                borderSide: const BorderSide(color: accent, width: 1.5)),
          ),
          navigationBarTheme: NavigationBarThemeData(
            backgroundColor: panel,
            indicatorColor: const Color(0xFFE8E9F7),
            labelTextStyle: WidgetStatePropertyAll(
                const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
          ),
        ),
        home: const SessionGate(),
      );
}

class SessionGate extends StatefulWidget {
  const SessionGate({super.key});

  @override
  State<SessionGate> createState() => _SessionGateState();
}

class _SessionGateState extends State<SessionGate> {
  bool loading = true;
  bool authenticated = false;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    final token = await api.storage.read(key: tokenKey);
    if (token != null && token.isNotEmpty) {
      try {
        await api.me();
        authenticated = true;
      } catch (_) {
        await api.storage.delete(key: tokenKey);
      }
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const SplashScreen();
    return authenticated ? const AppShell() : const LoginScreen();
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) => const Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.flight_takeoff_rounded, size: 48, color: accent),
              SizedBox(height: 14),
              Text('AERO-SENSE',
                  style: TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2)),
              SizedBox(height: 5),
              Text('COMPONENT INTELLIGENCE',
                  style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      color: muted,
                      letterSpacing: 1.6)),
              SizedBox(height: 22),
              SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                      strokeWidth: 2.5, color: accent)),
            ],
          ),
        ),
      );
}
