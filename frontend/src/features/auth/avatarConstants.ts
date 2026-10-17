export interface AvatarOption {
  id: string;
  name: string;
  role: string;
  url: string;
  badge: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'navigator',
    name: 'Elena',
    role: 'Tech Voyager',
    url: '/avatars/career_navigator.jpg',
    badge: 'UI/UX & Frontend',
  },
  {
    id: 'pilot_male',
    name: 'Marcus',
    role: 'Software Pilot',
    url: '/avatars/career_pilot_male.jpg',
    badge: 'Full Stack & Cloud',
  },
  {
    id: 'designer',
    name: 'Aria',
    role: 'Product Designer',
    url: '/avatars/career_designer.jpg',
    badge: 'Design Systems & AI',
  },
  {
    id: 'cloud_lead',
    name: 'Kai',
    role: 'Cloud Architect',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    badge: 'DevOps & Security',
  },
];
