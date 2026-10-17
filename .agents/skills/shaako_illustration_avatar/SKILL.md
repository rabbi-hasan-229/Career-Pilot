---
name: shaako_illustration_avatar
description: >-
  Standard, minimal bespoke vector illustration and hero avatar system for Shaako Flutter apps.
  Use whenever creating, redesigning, or styling hero graphics, feature avatars, empty-state illustrations,
  or graphical representations of app concepts (e.g. Vault, Referral, Wallet, Escrow, KYC, Orders) using
  hand-crafted Flutter CustomPainter line art instead of AI-generated raster images.
---

# Shaako Illustration & Avatar Standard (`shaako_illustration_avatar`)

This skill documents the exact design system, coordinate geometry, stroke weights, color tokens, and composition principles used for **bespoke vector illustrations and graphic avatars** across the **Shaako** Flutter application.

---

## 1. Core Design Philosophy: "Human-Crafted Vector over AI"

When creating graphic representations, feature avatars, or hero headers in Shaako:
- **NEVER use AI-generated 3D character avatars, glossy CGI renders, or raster robot/mascot art.** Users find generic AI art impersonal, bloated, and unpolished.
- **ALWAYS use hand-crafted Flutter `CustomPainter` 2D vector illustrations.**
- **Minimal, Modern, and Scalable:** Clean line art (1.6px), subtle pastel/neutral fills, crisp geometric accents, and responsive scaling that adapts instantly to dark/light theme switching.

---

## 2. Token & Color Architecture

All illustrations must dynamically respond to `isDark` using these exact brand tokens:

| Element | Dark Mode (`isDark == true`) | Light Mode (`isDark == false`) | Note |
| :--- | :--- | :--- | :--- |
| **Line Art Stroke** | `Color(0xFF94A3B8)` (Slate 400) | `Color(0xFF334155)` (Slate 700) | Uniform `1.6px` width, round caps |
| **Main Object Fill** | `Color(0xFF1E293B)` (Slate 800) | `Color(0xFFF8FAFC)` (Slate 50) | Primary body/chassis |
| **Inner Card / Recessed Door** | `Color(0xFF0F172A)` (Slate 900) | `Colors.white` | Foreground surfaces |
| **Secondary Accents / Hinges** | `Color(0xFF334155)` | `Color(0xFFE2E8F0)` / `CBD5E1` | Structural details |
| **Accent Primary (Blue)** | `Color(0xFF0284C7)` | `Color(0xFF0284C7)` | Tech / Brand blue |
| **Accent Glow / Highlight** | `Color(0xFF38BDF8)` (Sky 400) | `Color(0xFF38BDF8)` | Knobs, LEDs, rings |
| **Shaako Gold (SP / Rewards)** | `[Color(0xFFFFD54F), Color(0xFFF59E0B), Color(0xFFD97706)]` | Minted coin / lightning / key |
| **Status Active (Green)** | `Color(0xFF10B981)` (Emerald) | `Color(0xFF10B981)` | Active 24/7 indicator |
| **Base Shadow** | `Colors.black.withValues(alpha: 0.35)` | `Color(0xFF64748B).withValues(alpha: 0.08)` | Ground ellipse |

---

## 3. Stroke & Paint Standards

```dart
final strokeColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF334155);

// The canonical line-art stroke paint:
final linePaint = Paint()
  ..color = strokeColor
  ..style = PaintingStyle.stroke
  ..strokeWidth = 1.6
  ..strokeCap = StrokeCap.round
  ..strokeJoin = StrokeJoin.round;

final fillPaint = Paint()..style = PaintingStyle.fill;
```

---

## 4. Virtual Coordinate Space & Auto-Scaling

Illustrations should be designed on a virtual coordinate grid (typically `240 × 175` or `240 × 190`). This guarantees the illustration maintains identical aspect ratio and crisp fidelity whether rendered at `160×115`, `200×145`, or `300×220`.

```dart
@override
void paint(Canvas canvas, Size size) {
  const double baseWidth = 240.0;
  const double baseHeight = 175.0;

  final double scaleX = size.width / baseWidth;
  final double scaleY = size.height / baseHeight;
  final double scale = math.min(scaleX, scaleY);

  canvas.save();
  // Center in available space
  canvas.translate(
    (size.width - baseWidth * scale) / 2,
    (size.height - baseHeight * scale) / 2,
  );
  canvas.scale(scale);

  // ... Draw within 0..baseWidth and 0..baseHeight ...

  canvas.restore();
}
```

---

## 5. Composition Anatomy (5-Layer Rule)

Every standard Shaako illustration is composed of 5 intentional layers:

1. **Ambient Ground / Base Shadow:**
   - Soft flattened ellipse at the bottom:
   ```dart
   final groundPath = Path()
     ..addOval(Rect.fromCenter(center: const Offset(115, 158), width: 150, height: 16));
   fillPaint.color = (isDark ? Colors.black : const Color(0xFF64748B))
       .withValues(alpha: isDark ? 0.35 : 0.08);
   canvas.drawPath(groundPath, fillPaint);
   ```
2. **Central Focal Object:**
   - The primary metaphor (e.g. Vault Safe, Smartphone, Shield, Wallet, Chest).
   - Rounded corners (`Radius.circular(14)` - `18`).
   - Fill with `vaultFill` then stroke with `linePaint`.
   - Add inset / recessed inner panel (`doorFill`) with corner rivets or bolts.
3. **Core Mechanical / Interactive Detail:**
   - **Vault:** Combination dial with 12 radiating tick marks, 3-spoke turn handle with cyan knobs.
   - **Referral / Social:** Smartphone with letter emerging from envelope, '%' discount tag.
   - **Wallet / SP:** Minted coin with metallic gold gradient and engraved 'SP' typography.
   - **Security / KYC:** Shield badge with checkmark and photo frame.
4. **Floating Feature Badges / Functional Accents:**
   - Small floating pills/cards tilted at `0.1` to `0.25` radians.
   - Examples:
     - Digital credentials card with gold key icon (`Color(0xFFF59E0B)`).
     - Golden lightning bolt delivery badge (`Icons.bolt_rounded` equivalent).
     - Green active LED dot (`Color(0xFF10B981)`).
5. **Atmospheric Deco Elements:**
   - 4-point organic sparkles via cubic beziers:
   ```dart
   void _drawSparkle(Canvas canvas, Offset center, double radius, Color color) {
     final path = Path()
       ..moveTo(center.dx, center.dy - radius)
       ..cubicTo(center.dx, center.dy - radius * 0.2, center.dx + radius * 0.2, center.dy, center.dx + radius, center.dy)
       ..cubicTo(center.dx + radius * 0.2, center.dy, center.dx, center.dy + radius * 0.2, center.dx, center.dy + radius)
       ..cubicTo(center.dx, center.dy + radius * 0.2, center.dx - radius * 0.2, center.dy, center.dx - radius, center.dy)
       ..cubicTo(center.dx - radius * 0.2, center.dy, center.dx, center.dy - radius * 0.2, center.dx, center.dy - radius)
       ..close();
     canvas.drawPath(path, Paint()..color = color..style = PaintingStyle.fill);
   }
   ```
   - Floating stroke circles (`radius: 3..5`, `alpha: 0.3`).

---

## 6. Full Widget Template Boilerplate

```dart
// lib/features/<feature>/widgets/<feature>_hero_illustration.dart
import 'dart:math' as math;
import 'package:flutter/material.dart';

class FeatureHeroIllustration extends StatelessWidget {
  final double width;
  final double height;
  final bool isDark;

  const FeatureHeroIllustration({
    super.key,
    this.width = 200,
    this.height = 145,
    this.isDark = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: CustomPaint(
        painter: _FeatureArtPainter(isDark: isDark),
      ),
    );
  }
}

class _FeatureArtPainter extends CustomPainter {
  final bool isDark;

  _FeatureArtPainter({required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final strokeColor =
        isDark ? const Color(0xFF94A3B8) : const Color(0xFF334155);
    final primaryFill =
        isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC);
    final cardFill = isDark ? const Color(0xFF0F172A) : Colors.white;
    const accentBlue = Color(0xFF0284C7);
    const accentCyan = Color(0xFF38BDF8);
    const accentGold = Color(0xFFF59E0B);

    final linePaint = Paint()
      ..color = strokeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final fillPaint = Paint()..style = PaintingStyle.fill;

    const baseW = 240.0;
    const baseH = 175.0;
    final scale = math.min(size.width / baseW, size.height / baseH);

    canvas.save();
    canvas.translate((size.width - baseW * scale) / 2, (size.height - baseH * scale) / 2);
    canvas.scale(scale);

    // 1. Soft Shadow
    fillPaint.color = (isDark ? Colors.black : const Color(0xFF64748B))
        .withValues(alpha: isDark ? 0.35 : 0.08);
    canvas.drawOval(
      Rect.fromCenter(center: const Offset(baseW / 2, 155), width: 140, height: 16),
      fillPaint,
    );

    // 2. Main Body
    final mainRect = RRect.fromRectAndRadius(
      const Rect.fromLTWH(65, 45, 110, 100),
      const Radius.circular(16),
    );
    fillPaint.color = primaryFill;
    canvas.drawRRect(mainRect, fillPaint);
    canvas.drawRRect(mainRect, linePaint);

    // 3. Inner Detail Panel
    final innerRect = RRect.fromRectAndRadius(
      const Rect.fromLTWH(76, 56, 88, 78),
      const Radius.circular(10),
    );
    fillPaint.color = cardFill;
    canvas.drawRRect(innerRect, fillPaint);
    canvas.drawRRect(innerRect, linePaint);

    // 4. Floating Badges / Sparkles
    _drawSparkle(canvas, const Offset(36, 60), 5.0, accentCyan);
    _drawSparkle(canvas, const Offset(204, 75), 6.0, accentBlue);
    _drawSparkle(canvas, const Offset(195, 25), 4.5, accentGold);

    canvas.restore();
  }

  void _drawSparkle(Canvas canvas, Offset center, double radius, Color color) {
    final path = Path()
      ..moveTo(center.dx, center.dy - radius)
      ..cubicTo(center.dx, center.dy - radius * 0.2, center.dx + radius * 0.2, center.dy, center.dx + radius, center.dy)
      ..cubicTo(center.dx + radius * 0.2, center.dy, center.dx, center.dy + radius * 0.2, center.dx, center.dy + radius)
      ..cubicTo(center.dx, center.dy + radius * 0.2, center.dx - radius * 0.2, center.dy, center.dx - radius, center.dy)
      ..cubicTo(center.dx - radius * 0.2, center.dy, center.dx, center.dy - radius * 0.2, center.dx, center.dy - radius)
      ..close();
    canvas.drawPath(path, Paint()..color = color..style = PaintingStyle.fill);
  }

  @override
  bool shouldRepaint(covariant _FeatureArtPainter oldDelegate) =>
      oldDelegate.isDark != isDark;
}
```

---

## 7. Canonical Implementations in Codebase

- **Refer & Earn Hero:** [`lib/features/referral/presentation/widgets/referral_hero_illustration.dart`](file:///e:/Shaako/Shaako/lib/features/referral/presentation/widgets/referral_hero_illustration.dart)
  - Features: Person silhouette, tilted smartphone, envelope with emerging letter, minted 3D SP Gold Coin with metallic beveled rim.
- **Vault Slot Purchase Hero:** [`lib/features/vault/widgets/vault_hero_illustration.dart`](file:///e:/Shaako/Shaako/lib/features/vault/widgets/vault_hero_illustration.dart)
  - Features: Heavy vault safe box, cylindrical bolt hinges, 12-tick combination dial with 3-spoke turn handles, digital PIN keypad with emerald LED, floating credentials card with gold key, and instant delivery lightning bolt badge.
