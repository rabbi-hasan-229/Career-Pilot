import { describe, it, expect } from 'vitest';
import { isRolePlanOutline } from './aiGateway';

describe('aiGateway validation helpers', () => {
  it('validates properly formed 4-milestone role plan outlines', () => {
    const validOutline = {
      role_title: 'Platform Engineer',
      total_hours: 120,
      milestones: [
        { position: 1, title: 'Foundations', focus: 'Core Linux & networking', skills: ['Linux', 'Networking'], effort_hours: 30 },
        { position: 2, title: 'Containers', focus: 'Docker and orchestration', skills: ['Docker', 'Kubernetes'], effort_hours: 30 },
        { position: 3, title: 'Automation', focus: 'Infrastructure as code & CI', skills: ['Terraform', 'GitHub Actions'], effort_hours: 30 },
        { position: 4, title: 'Reliability', focus: 'SLO monitoring and incidents', skills: ['Prometheus', 'SLOs'], effort_hours: 30 },
      ],
    };

    expect(isRolePlanOutline(validOutline, 'platform engineer')).toBe(true);
    expect(isRolePlanOutline({ ...validOutline, total_hours: 100 }, 'platform engineer')).toBe(false);
    expect(isRolePlanOutline(validOutline, 'Different Role')).toBe(false);
  });
});
