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
          // Keep the mobile layout stable even when Android display/font
          // scaling is set very high. Individual pages remain scrollable.
          final media = MediaQuery.of(context).copyWith(
            textScaler: const TextScaler.linear(1.0),
          );
          return MediaQuery(data: media, child: child ?? const SizedBox.shrink());
        },
        theme: ThemeData(
          useMaterial3: true,
          scaffoldBackgroundColor: bg,
          colorScheme: ColorScheme.fromSeed(seedColor: accent),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: soft,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(17),
              borderSide: const BorderSide(color: line),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(17),
              borderSide: const BorderSide(color: line),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(17),
              borderSide: const BorderSide(color: accent, width: 1.5),
            ),
          ),
          navigationBarTheme: const NavigationBarThemeData(
            backgroundColor: panel,
            indicatorColor: Color(0xFFE8E9F7),
            labelTextStyle: WidgetStatePropertyAll(
              TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
            ),
          ),
        ),
      );
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
              Text(
                'AERO-SENSE',
                style: TextStyle(fontSize: 21, fontWeight: FontWeight.w900, letterSpacing: 2),
              ),
              SizedBox(height: 5),
              Text(
                'COMPONENT INTELLIGENCE',
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: muted, letterSpacing: 1.6),
              ),
              SizedBox(height: 22),
              SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: accent)),
            ],
          ),
        ),
      );
}
