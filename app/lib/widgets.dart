import 'package:flutter/material.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:nfc_manager/nfc_manager_ios.dart';
import 'theme.dart';

/// Shared Aero-Sense brand mark. The aircraft, tracking arc and NFC waves
/// mirror the approved app/website identity and scale cleanly from navigation
/// size to splash/login size.
class AeroLogo extends StatelessWidget {
  final double size;
  final bool boxed;
  const AeroLogo({this.size = 42, this.boxed = true, super.key});
  @override
  Widget build(BuildContext context) {
    if (!boxed) {
      return SizedBox(width: size, height: size, child: Stack(alignment: Alignment.center, children: [CustomPaint(size: Size.square(size), painter: _AeroRadarPainter()), Icon(Icons.flight_takeoff_rounded, size: size * .58, color: const Color(0xFF1E3A8A))]));
    }
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFFFFFFF), Color(0xFFF1F4FF), Color(0xFFDCE5FF)]), borderRadius: BorderRadius.circular(size * .30), border: Border.all(color: const Color(0xFFD9DEF2)), boxShadow: const [BoxShadow(color: Color(0x18000000), blurRadius: 16, offset: Offset(0, 6))]),
      child: Stack(alignment: Alignment.center, children: [CustomPaint(size: Size.square(size), painter: _AeroRadarPainter()), Icon(Icons.flight_takeoff_rounded, size: size * .52, color: const Color(0xFF1E3A8A))]),
    );
  }
}

class _AeroRadarPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final s = size.shortestSide;
    final center = Offset(s * .53, s * .54);
    final arcPaint = Paint()..color = const Color(0xFF3157CF)..style = PaintingStyle.stroke..strokeWidth = s * .055..strokeCap = StrokeCap.round;
    canvas.drawArc(Rect.fromCircle(center: Offset(s * .49, s * .48), radius: s * .32), -2.72, 2.25, false, arcPaint);
    final wavePaint = Paint()..color = const Color(0xFF8FA9F8)..style = PaintingStyle.stroke..strokeWidth = s * .045..strokeCap = StrokeCap.round;
    canvas.drawArc(Rect.fromCircle(center: Offset(center.dx, s * .69), radius: s * .20), .25, 2.65, false, wavePaint);
    canvas.drawArc(Rect.fromCircle(center: Offset(center.dx, s * .70), radius: s * .13), .25, 2.65, false, wavePaint);
  }
  @override bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Compatibility adapter used by the NFC screen. nfc_manager 4.x exposes
/// platform-specific iOS tag classes rather than a generic NfcTagIos class.
class NfcTagIos {
  final List<int> identifier;
  const NfcTagIos(this.identifier);

  static NfcTagIos? from(NfcTag tag) {
    final mifare = MiFareIos.from(tag);
    if (mifare != null && mifare.identifier.isNotEmpty) return NfcTagIos(mifare.identifier);
    final iso15693 = Iso15693Ios.from(tag);
    if (iso15693 != null && iso15693.identifier.isNotEmpty) return NfcTagIos(iso15693.identifier);
    final iso7816 = Iso7816Ios.from(tag);
    if (iso7816 != null && iso7816.identifier.isNotEmpty) return NfcTagIos(iso7816.identifier);
    return null;
  }
}

extension ComponentUpdateHistoryDisplay on ComponentUpdateHistory {
  String get action => 'Component updated';
  String? get actorName => userName;
  String get createdAt => updatedAt;
}

class CardBox extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry margin;
  const CardBox({required this.child, this.margin = EdgeInsets.zero, super.key});
  @override
  Widget build(BuildContext context) => Container(margin: margin, padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: panel, borderRadius: BorderRadius.circular(20), border: Border.all(color: line), boxShadow: const [BoxShadow(color: Color(0x12000000), blurRadius: 18, offset: Offset(0, 7))]), child: child);
}

class Section extends StatelessWidget {
  final String title; final Widget child;
  const Section({required this.title, required this.child, super.key});
  @override
  Widget build(BuildContext context) => CardBox(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)), const SizedBox(height: 12), child]));
}

class StatusPill extends StatelessWidget {
  final String status;
  const StatusPill(this.status, {super.key});
  @override
  Widget build(BuildContext context) {
    final value = status.trim().toUpperCase();
    final positive = value == 'ACTIVE' || value == 'AUTHENTIC' || value == 'PASSED';
    final negative = value == 'FAILED' || value == 'SUSPENDED' || value == 'INVALID';
    final color = positive ? good : negative ? Colors.red : muted;
    return Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: color.withValues(alpha: .10), borderRadius: BorderRadius.circular(999)), child: Text(value.isEmpty ? '—' : value, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: .6)));
  }
}

class EventRow extends StatelessWidget {
  final String title; final String subtitle; final bool ok;
  const EventRow({required this.title, required this.subtitle, required this.ok, super.key});
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(bottom: 12), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(ok ? Icons.check_circle_outline : Icons.error_outline, size: 20, color: ok ? good : Colors.red), const SizedBox(width: 10), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontWeight: FontWeight.w700)), const SizedBox(height: 3), Text(subtitle, style: const TextStyle(color: muted, fontSize: 12))]))]));
}
