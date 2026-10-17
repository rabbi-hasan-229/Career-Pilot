import React from 'react';
import { Road3DGameView } from './Road3DGameView';
import type { Task, Milestone, Profile } from '../../types';

interface Props {
  tasks: Task[];
  milestones: Milestone[];
  profile: Profile;
  onSelectTaskForQuiz?: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onApplyPlannerAction?: (action: 'behind' | 'early' | 'pause') => void;
  onOpenGoalSettings: () => void;
  onOpenCoach?: () => void;
  onOpenNotifications: () => void;
}

export const RoadmapView: React.FC<Props> = ({
  tasks,
  milestones,
  profile,
  onToggleTaskComplete,
  onOpenGoalSettings,
  onOpenNotifications,
}) => {
  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <Road3DGameView
        milestones={milestones}
        tasks={tasks}
        profile={profile}
        onToggleTaskComplete={onToggleTaskComplete}
        onOpenGoalSettings={onOpenGoalSettings}
        onOpenNotifications={onOpenNotifications}
      />
    </div>
  );
};
