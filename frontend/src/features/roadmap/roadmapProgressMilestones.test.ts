import { describe, expect, it } from 'vitest';
import { getJourneyCheckpointMap } from './roadmapProgressMilestones';

describe('roadmapProgressMilestones', () => {
  it('assigns distinct 20%, 50%, 80%, and 100% checkpoints across stage counts', () => {
    for (const count of [4, 5, 6, 8, 10, 12, 20]) {
      const map = getJourneyCheckpointMap(count);
      expect(map.size).toBe(4);
      expect(map.get(count - 1)).toBe(100);
      const entries = Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
      expect(entries.map(([, pct]) => pct)).toEqual([20, 50, 80, 100]);
    }

    const ten = getJourneyCheckpointMap(10);
    expect(ten.get(1)).toBe(20);
    expect(ten.get(4)).toBe(50);
    expect(ten.get(7)).toBe(80);
    expect(ten.get(9)).toBe(100);
  });

  it('handles compact roadmaps with fewer than 4 stages gracefully', () => {
    const three = getJourneyCheckpointMap(3);
    expect(three.get(0)).toBe(20);
    expect(three.get(1)).toBe(50);
    expect(three.get(2)).toBe(100);
  });
});
