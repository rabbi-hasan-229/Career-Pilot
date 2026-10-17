---
name: shaako-ui-standards
description: >-
  Shaako mobile and web UI design standards, aesthetic guidelines, typography scales,
  component patterns, and styling rules. Use whenever creating, modifying, redesigning,
  or reviewing any Flutter UI screens, dialogs, widgets, or components in Shaako (including
  Product Details, Vault Details, Profile, KYC, Wallet, Live Orders, and Marketplace).
---

# Shaako UI Design Standards & Guidelines

This skill documents the finalized, production-grade UI design system and user preferences for the **Shaako** Flutter application. Adhere strictly to these patterns whenever building, editing, or refactoring any screens or widgets.

---

## 1. Core Aesthetic Principles

### The "Marketplace Classic Compact" Philosophy
- **High Information Density**: Present essential product, seller, financial, and order details compactly without sprawling cards or excessive vertical whitespace.
- **Restrained & Professional Palette**:
  - **NEVER use overly colorful designs**, multi-color rainbow gradients, cyber-glows, or heavy neon borders.
  - Price offer containers, metric containers, and cards must remain clean, neutral, and elegant.
  - Neutral surfaces:
    - Scaffold background: Light `Color(0xFFF8FAFD)` / `Color(0xFFF6F8FC)`; Dark `Color(0xFF090D16)` / `Color(0xFF0F172A)`.
    - Cards / Bento containers: Light `Colors.white` / `Color(0xFFF8FAFC)`; Dark `Color(0xFF131B2E)` / `Color(0xFF1E2430)`.
    - Subtle borders: Light `Color(0xFFE2E8F0)`; Dark `Colors.white.withValues(alpha: 0.08)` or `Color(0xFF334155)`.
    - Dividers: Light `Color(0xFFF1F5F9)` / `Colors.grey.withValues(alpha: 0.15)`; Dark `Colors.white.withValues(alpha: 0.06)`.
- **High-Contrast Text Rule**:
  - Verification badges ("KYC Verified", "Basic Verified"), status labels, and key metric texts MUST render in pure black in light mode (`isDark ? Colors.white : Colors.black` or `const Color(0xFF0F172A)`) and bright white in dark mode.
  - Never use washed-out grey or unreadable low-contrast colors for primary titles, values, or verification tags.

---

## 2. Typography Hierarchy

Every screen in Shaako must follow this strict typography scale. Do not introduce arbitrary heading sizes (e.g. 17, 18, 19).

| Component / Element | Font Size | Font Weight | Letter Spacing | Styling / Color Details |
| :--- | :--- | :--- | :--- | :--- |
| **Section Headings** | **`15.5`** | `FontWeight.bold` / `w800` | `-0.2` | Universal heading style across all sections and modals. |
| **App Bar Titles** | **`15.5` - `18.0`** | `FontWeight.w800` | `-0.2` | Centered title, high-contrast primary text. |
| **Product / Item Title** | **`15.5`** | `FontWeight.w600` | `-0.15` | `height: 1.28`, max 2 lines with ellipsis. |
| **Primary Price** | **`20.0`** | `FontWeight.w800` | `-0.5` | Currency symbol `৳ ` in `kPriceColor`. |
| **Original Strikethrough Price** | **`13.0`** | `FontWeight.normal` | `0.0` | Grey, `TextDecoration.lineThrough`. |
| **Discount Badge** | **`10.0`** | `FontWeight.bold` | `0.0` | Red text, 4px rounded red pill (`alpha: 0.12`). |
| **Bento / Spec Column Label** | **`9.0` - `9.5`** | `FontWeight.w700` | `0.5 - 1.2` | Uppercase, muted grey secondary text. |
| **Bento / Spec Column Value** | **`12.0`** | `FontWeight.w700` | `-0.1` | High contrast (`isDark ? Colors.white : Colors.black`). |
| **Body & Instruction Items** | **`15.0`** | `FontWeight.normal` | `0.0` | `height: 1.4`, `Theme.of(context).textTheme.bodyMedium?.color`. |
| **Meta / Subtitle Details** | **`11.0` - `12.0`** | `FontWeight.w500` | `0.0` | Neutral grey (`Colors.grey.shade600` / `shade400`). |

---

## 3. Screen & Component Archetypes

### 3.1 Product Details & Vault Details Screens
- **Media Carousel (`ProductDetailsCompactMedia`)**:
  - Aspect Ratio: Fixed **`16 / 10.5`** (~1.52:1), border radius `14.0px`.
  - Indicators: Top-left `Zoom` pill (`Icons.zoom_in_rounded`), bottom-right `1/N` counter pill.
  - Interactive: Tap opens full-screen pinch-to-zoom viewer.
  - Always wrap image URLs with `optimizeImageUrl(url, width: 900)` for CDN caching.
- **Trust & Fulfillment 3-Column Bento Card (`ProductTrustFulfillmentCard`)**:
  - 3 balanced columns with vertical dividers:
    1. **Column 1 (`PROTECTION`)**: Escrow coverage (e.g., `24h Escrow` or `72h Escrow`, `Icons.shield_outlined`, green `Color(0xFF10B981)`).
    2. **Column 2 (`DELIVERY`)**: Guaranteed delivery window (e.g., `24 Hours`, `Instant`, `Icons.electric_bolt_rounded`, amber `Color(0xFFF59E0B)`).
    3. **Column 3 (`SELLER`)**: **Always displays seller verification** (`KYC Verified`, `Basic Verified`, or `Unverified`). Never show buyer requirements here.
  - Metric values must be pure black in light mode.
- **Price Offer / Negotiable Container**:
  - Clean and neutral: Light grey border (`Color(0xFFE2E8F0)`), standard rounded rectangle (`12-14px`).
  - No gradient fills or saturated colors.
  - Left: `Icons.local_offer_rounded` inside circular badge + `Offer Price` label. Right: Compact `Make Offer` pill button.
- **Action Buttons Bar (`ProductActionButtonsBar`)**:
  - Height: Fixed at **`48px`**, border radius: **`14px`**.
  - Buttons: Chat (`Icons.chat_bubble_outline_rounded`), Offer (`Icons.local_offer_outlined`), Buy Now with **`Icons.shopping_bag_outlined`**.
  - Seller Guard: Always disable ordering and offers on user's own listing (`!isSeller` / `!isOwnListing`).

### 3.2 Identity Verification & KYC Screen (`KycScreen`)
- **App Bar**: Circular 34x34 back button with subtle border and shadow; centered title at `15.5px` bold.
- **2-Tier Verification Architecture**:
  - **Step 1: Basic Verification (50% max)**:
    - Personal details: 20%
    - Phone OTP: 15%
    - Passkey / Biometrics: 15%
  - **Step 2: KYC Verification (50% max)**:
    - Government ID (NID / Passport / DL) + Live Selfie: 50%
- **Dynamic Hero Card**:
  - Progress gradient card with subtle tint (`0xFF131D31` in dark, `0xFFEFF6FF` in light).
  - Dynamic copy adjusting according to completion stage (e.g., "Get Started", "Almost There!", "Basic Verified", "Fully Verified").
- **Action Buttons**:
  - Clear, concise action labels (e.g., "Verify Phone", "Setup Passkey", "Submit ID").
  - Do NOT clutter action buttons with percentage labels.

### 3.3 Profile Screen (`ProfileScreen`)
- **Header**:
  - 34-radius avatar with edit icon overlay on bottom right.
  - Display name (19px bold) with inline verification badge (`Icons.verified_rounded` in green for KYC, grey for Partial, red outlined for Unverified).
  - Horizontal chip row displaying Phone, Email, and KYC badge pills.
- **Follower & Rating Card**:
  - Rounded container (`14px`), subtle border, 2-column layout divided by vertical hairline.
  - Follower count and average star rating (`⭐ 4.9`).
- **Completed Trades Card**:
  - Green-tinted container (`Color(0xFF10B981).withValues(alpha: 0.1)`) with circular swap icon (`Icons.swap_horiz`).
  - Completed trades counter + chevron navigating to `TradeHistoryScreen`.

### 3.4 Wallet Screen (`WalletScreen`)
- **Hero Balance Card**:
  - Always uses `assets/shaako_wallet_card_background.png` with `1.76` aspect ratio and `24px` border radius.
  - Ambient blue glow box shadow (`0xFF0D5CD6`).
  - Top row: `SpCoinIcon` + "SHAAKO POINTS" label + "Live Secured" pill.
  - Middle: FittedBox SP balance (large bold font supporting 1 Crore+ smoothly) + BDT equivalent (`≈ ৳... BDT`).
  - Bottom row: Conversion rate (`1 SP = ৳1.00 BDT`) + Status ("Active • Verified").
- **Quick Action Squircles**:
  - 4 quick actions: Top Up / Deposit, Withdraw SP, History, Transfer.
  - Clean squircle icons with high-contrast labels.

---

## 4. Verification & KYC 3-Tier Model

| Status Key | Label | Badge Style | Requirements |
| :--- | :--- | :--- | :--- |
| `not_verified` | **Unverified** | Red outline / grey badge | Incomplete basic steps |
| `partial` | **Basic Verified** | Blue / Grey shield badge (`0xFF717171`) | Phone + Email + Passkey verified |
| `verified` | **KYC Verified** | Green badge (`0xFF10B981`) | Government ID + Live Selfie approved |

**Text Color Rule**: "Basic Verified" and "KYC Verified" text strings must render in pure black in light mode.

---

## 5. Coding & Implementation Checklist

1. **Light / Dark Mode**: Every container, divider, border, and text must use `isDark ? darkStyle : lightStyle` (or `context.isDarkMode`).
2. **Modern Color Opacity**: Never use deprecated `.withOpacity(...)`. Always use `.withValues(alpha: ...)`.
3. **Web Constrain**: Wrap scrollable views with `webConstrain(context, maxWidth: 800, ...)` to ensure desktop layout stability.
4. **Haptic Feedback**: Always trigger `HapticFeedback.lightImpact()` on tap for interactive chips, buttons, and navigation icons.
5. **No Mock Data / Placeholders**: Bind directly to Riverpod providers (`profileNotifierProvider`, `userWalletProvider`, `listingDetailsProvider`).
