---
name: gamified-design-system
description: Gamified Island Quest Design System and UI guidelines for Career Pilot, matching playful 3D isometric roadmap maps, carved wooden pill UI components, step checkpoint quizzes, and tactile micro-interactions.
---

# Gamified Design System: Career Pilot

This skill guides the design and implementation of Career Pilot's game interface, inspired by playful isometric RPG maps (e.g., Duolingo, Candy Crush, Animal Crossing) and tactile carved wooden controls.

## 1. Visual & Aesthetic Principles

- **World Environment:** Lush green 3D isometric island terrain, golden sand beaches, turquoise sparkling water, winding cobblestone road with wooden docks and landmark structures.
- **Color Palette:**
  - Wood & Amber: `#D97706` (Golden Honey), `#B45309` (Warm Caramel), `#78350F` (Carved Wood Base), `#451A03` (Dark Bark).
  - Island Nature: `#10B981` (Lush Forest), `#34D399` (Soft Meadow), `#06B6D4` (Lagoon Cyan), `#3B82F6` (Ocean Blue).
  - Parchment & Sand: `#FEF3C7` (Warm Sand), `#FFFBEB` (Parchment Card), `#F59E0B` (XP Star).
  - Accent / Urgency: `#EF4444` (Deadline Bell / Alert), `#8B5CF6` (Magic / AI Crystal).
- **Tactile Button Styling (Wooden 3D Press):**
  - Buttons use a solid bottom bevel/border (`box-shadow: 0 4px 0 #78350F`) and translate down on active (`transform: translateY(3px); box-shadow: 0 1px 0 #78350F`).
  - Warm rounded corners (`border-radius: 9999px` or `20px`).
  - Crisp embossed icons with subtle inner highlights.

## 2. Road & Island Canvas Components

- **Winding Road Nodes:**
  - SVG bezier curves connecting milestone landmarks.
  - Node States:
    - `DONE`: Golden star medal or green checkmark badge with particle sparkle.
    - `ACTIVE`: Bouncing character pin with pulsing golden aura and "Ready for Quiz" label.
    - `LOCKED`: Semi-transparent wooden padlock, greyed out road segment.
- **Step Checkpoint Quizzes:**
  - Every step node triggers a quick interactive quiz modal before marking as complete.
  - 2 to 3 questions covering key concepts of the task.
  - Success triggers confetti particles, audio chime, and updates progress instantly.

## 3. UI Screen Hierarchy

1. **Map Screen (Home):**
   - Top Bar: Greeting ("Hey, [Name]"), streak counter with flame icon, coin pouch, and notification bell.
   - Main Canvas: Scrollable vertical isometric island path with milestones and side quest icons (Leaderboard, Daily Chest, New Task).
   - Bottom Dock: Carved floating wooden dock with Home, Jobs, Curriculum, Coach, and Profile.
2. **Analytics Screen:**
   - Filter dropdown ("All Subject / Weekly / Monthly").
   - Large stat cards: Total lessons, study hours vs daily budget.
   - Warm amber bar charts showing day-by-day effort.
3. **Hero Profile Screen:**
   - Circular wooden-framed character avatar.
   - Job target title, XP level, and active roadmap cards with cute mascots.
   - Urgency banner: "Deadline is coming!" with days remaining countdown.
