import { describe, it, expect } from 'vitest';
import { CV_TEMPLATES } from './cvTemplatesCatalog';
import type { CVTemplateId } from '../../types';

describe('CV Templates System', () => {
  it('exposes exactly 5 distinct visual templates', () => {
    expect(CV_TEMPLATES).toHaveLength(5);
    const ids: CVTemplateId[] = ['modern', 'minimalist', 'executive', 'creative', 'compact'];
    for (const id of ids) {
      const match = CV_TEMPLATES.find((t) => t.id === id);
      expect(match).toBeDefined();
      expect(match?.name).toBeTruthy();
      expect(match?.description).toBeTruthy();
      expect(match?.badge).toBeTruthy();
      expect(match?.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('guarantees unique template IDs', () => {
    const ids = CV_TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
