---
name: smart-quiz-engine
description: Smart checkpoint quiz engine for Career Pilot, managing automated question verification, instant scoring, XP/Coin distribution, and gated progression on roadmap steps.
---

# Smart Quiz Engine: Career Pilot

The Smart Quiz Engine ensures active learning retention by testing users on key concepts before allowing a roadmap task to be marked complete.

## 1. Progression Gate Mechanism

1. **Step Initiation:** User taps an active road stone node on the island map.
2. **Learning Phase:** Task shows objective, estimated minutes, and linked curated resource.
3. **Checkpoint Trigger:** The "Complete Step" button opens the Checkpoint Challenge modal.
4. **Interactive Quiz Execution:**
   - 2 to 3 concise, high-yield multiple-choice or scenario questions.
   - Questions have instant visual cues: green checkmark on correct, soft red shake on incorrect with helpful hint.
5. **Reward & Unlock:**
   - When all questions are answered correctly:
     - Award XP (e.g. +25 XP) and Coins (e.g. +5 Coins).
     - Record row in `quiz_submissions`.
     - Update `tasks.done_at = now()`.
     - Trigger confetti animation, unlock the next road stone node, and advance the character avatar along the path.
