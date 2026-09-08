import 'package:flutter/material.dart';

import 'app_router.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AeroSenseApp());
}

class AeroSenseApp extends StatelessWidget {
  const AeroSenseApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp.router(
        debugShowCheckedModeBanner: false,
        title: 'Aero-Sense',
        routerConfig: appRouter,
        builder: (context, child) {
          final media = MediaQuery.of(context).copyWith(
            textScaler: const TextScaler.linear(1.0),
          );
          return MediaQuery(data: media, child: child ?? const SizedBox.shrink());
        },
        theme: buildAeroTheme(),
      );
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFFEEECF8), bg, soft],
            ),
          ),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 76,
                  height: 76,
                  decoration: BoxDecoration(
                    color: panel,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: line),
                    boxShadow: const [
                      BoxShadow(color: Color(0x16000000), blurRadius: 24, offset: Offset(0, 10)),
                    ],
                  ),
                  child: const Icon(Icons.flight_takeoff_rounded, size: 38, color: accent),
                ),
                const SizedBox(height: 20),
                const Text('AERO-SENSE', style: TextStyle(fontSize: 21, fontWeight: FontWeight.w900, letterSpacing: 2)),
                const SizedBox(height: 6),
                const Text('COMPONENT INTELLIGENCE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: muted, letterSpacing: 1.6)),
                const SizedBox(height: 28),
                const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2.5, color: accent)),
              ],
            ),
          ),
        ),
      );
}
