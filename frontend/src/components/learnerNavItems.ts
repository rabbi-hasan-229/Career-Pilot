import {
  Home,
  Calendar,
  PieChart,
  Bot,
  Mic2,
  FileText,
  Briefcase,
  User,
  GraduationCap,
} from 'lucide-react';
import type { ActiveNavTab } from '../types';

export const LEARNER_CORE_NAV_ITEMS = [
  { id: 'home' as ActiveNavTab, label: 'Roadmap', icon: Home },
  { id: 'plan' as ActiveNavTab, label: 'Schedule', icon: Calendar },
  { id: 'overview' as ActiveNavTab, label: 'Analytics', icon: PieChart },
  { id: 'coach' as ActiveNavTab, label: 'AI Coach', icon: Bot },
];

export const LEARNER_TOOL_NAV_ITEMS = [
  { id: 'interview' as ActiveNavTab, label: 'Interviews', icon: Mic2 },
  { id: 'cv' as ActiveNavTab, label: 'Resume', icon: FileText },
  { id: 'skills' as ActiveNavTab, label: 'Job Market', icon: Briefcase },
  { id: 'experts' as ActiveNavTab, label: 'Experts', icon: GraduationCap },
  { id: 'profile' as ActiveNavTab, label: 'Account', icon: User },
];
