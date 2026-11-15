import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { Task } from '../../types';

interface Props {
  resource?: Task['resource'];
}

export const TaskResourceLink: React.FC<Props> = ({ resource }) => {
  if (!resource?.url) return null;
  let url: URL;
  try {
    url = new URL(resource.url);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;

  return (
    <a
      href={url.toString()}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px', color: 'var(--md-primary)', fontSize: '11px', fontWeight: 800, textDecoration: 'none' }}
    >
      Open {resource.provider || 'learning'} resource <ExternalLink size={12} aria-hidden="true" />
    </a>
  );
};
