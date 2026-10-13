import React from 'react';
import type { ActiveNavTab } from '../types';
import { BottomNav } from './BottomNav';

interface Props {
  activeTab: ActiveNavTab;
  onChangeTab: (tab: ActiveNavTab) => void;
  onOpenQuickAction?: () => void;
}

export const BottomDock: React.FC<Props> = ({
  activeTab,
  onChangeTab,
  onOpenQuickAction = () => { },
}) => {
  return (
    <BottomNav
      activeTab={activeTab}
      onChangeTab={onChangeTab}
      onOpenQuickAction={onOpenQuickAction}
    />
  );
};

export default BottomDock;
