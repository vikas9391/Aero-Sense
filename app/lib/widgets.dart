import 'package:flutter/material.dart';
import 'theme.dart';

class CardBox extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry margin;
  const CardBox({required this.child, this.margin = EdgeInsets.zero, super.key});

  @override
  Widget build(BuildContext context) => Container(
        margin: margin,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: panel,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: line),
          boxShadow: const [BoxShadow(color: Color(0x12000000), blurRadius: 18, offset: Offset(0, 7))],
        ),
        child: child,
      );
}

class Section extends StatelessWidget {
  final String title;
  final Widget child;
  const Section({required this.title, required this.child, super.key});

  @override
  Widget build(BuildContext context) => CardBox(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          child,
        ]),
      );
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: color.withValues(alpha: .10), borderRadius: BorderRadius.circular(999)),
      child: Text(value.isEmpty ? '—' : value, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: .6)),
    );
  }
}

class EventRow extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool ok;
  const EventRow({required this.title, required this.subtitle, required this.ok, super.key});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(ok ? Icons.check_circle_outline : Icons.error_outline, size: 20, color: ok ? good : Colors.red),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 3),
            Text(subtitle, style: const TextStyle(color: muted, fontSize: 12)),
          ])),
        ]),
      );
}
