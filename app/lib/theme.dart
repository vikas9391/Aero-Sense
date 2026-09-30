import 'package:flutter/material.dart';

// Aero-Sense aviation palette: calm surfaces, high-contrast actions.
const bg = Color(0xFFF4F7FA);
const panel = Colors.white;
const accent = Color(0xFF087E9B);
const muted = Color(0xFF647482);
const line = Color(0xFFE1E8ED);
const good = Color(0xFF16856D);
const soft = Color(0xFFF7FAFC);
const warning = Color(0xFFB7791F);
const critical = Color(0xFFB13A2F);
const info = Color(0xFF2A668A);
const accentSoft = Color(0xFFE5F4F7);

ThemeData buildAeroTheme() {
  final scheme = ColorScheme.fromSeed(seedColor: accent, brightness: Brightness.light, surface: panel);
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: bg,
    fontFamily: 'Roboto',
    visualDensity: VisualDensity.standard,
    pageTransitionsTheme: const PageTransitionsTheme(builders: <TargetPlatform, PageTransitionsBuilder>{TargetPlatform.android: FadeForwardsPageTransitionsBuilder()}),
    appBarTheme: const AppBarTheme(backgroundColor: bg, foregroundColor: Color(0xFF172B3A), elevation: 0, scrolledUnderElevation: 0, centerTitle: false, titleTextStyle: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF172B3A))),
    cardTheme: CardThemeData(color: panel, elevation: 0, margin: EdgeInsets.zero, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: const BorderSide(color: line))),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: soft,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      labelStyle: const TextStyle(color: muted, fontWeight: FontWeight.w600),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: line)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: line)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: accent, width: 1.5)),
    ),
    filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(minimumSize: const Size(0, 50), padding: const EdgeInsets.symmetric(horizontal: 18), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), textStyle: const TextStyle(fontWeight: FontWeight.w800))),
    outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(minimumSize: const Size(0, 50), padding: const EdgeInsets.symmetric(horizontal: 18), side: const BorderSide(color: line), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), textStyle: const TextStyle(fontWeight: FontWeight.w800))),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: panel,
      elevation: 0,
      indicatorColor: accentSoft,
      labelTextStyle: WidgetStateProperty.resolveWith((states) => const TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
      iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(color: states.contains(WidgetState.selected) ? accent : muted)),
    ),
    snackBarTheme: SnackBarThemeData(behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
  );
}
