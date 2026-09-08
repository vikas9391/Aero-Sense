import 'package:flutter/material.dart';

import 'app_router.dart';
import 'theme.dart';
import 'widgets.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  ErrorWidget.builder = (FlutterErrorDetails details) => Material(
        color: bg,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: CardBox(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 44),
                  const SizedBox(height: 12),
                  const Text('Aero-Sense encountered a display error', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
                  const SizedBox(height: 8),
                  const Text('Please return to the previous screen and try again.', style: TextStyle(color: muted), textAlign: TextAlign.center),
                  if (const bool.fromEnvironment('dart.vm.product') == false) ...[
                    const SizedBox(height: 12),
                    Text(details.exceptionAsString(), style: const TextStyle(color: muted, fontSize: 11), textAlign: TextAlign.center),
                  ],
                ],
              ),
            ),
          ),
        ),
      );
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
          final media = MediaQuery.of(context).copyWith(textScaler: const TextScaler.linear(1.0));
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
          decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFFEEECF8), bg, soft])),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const AeroLogo(size: 76),
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
