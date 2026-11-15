import React, { useEffect, useState } from 'react';
import { BookOpen, ExternalLink, Search } from 'lucide-react';
import { careerCategories, type CareerCategory } from '../roadmap/careerCatalog';
import { searchLearningResources, type LearningResource } from './resourceRepository';
import { CardGridSkeleton } from '../../components/SkeletonScreen';

interface Props {
  targetRole: string;
  targetRoleCategory?: CareerCategory;
  onAddToPlan: (resource: Pick<LearningResource, 'id' | 'title' | 'category'>) => Promise<boolean>;
}

function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

const buttonStyle: React.CSSProperties = {
  border: '1px solid var(--md-outline)',
  borderRadius: '999px',
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export const LearningResourcesPanel: React.FC<Props> = ({ targetRole, targetRoleCategory, onAddToPlan }) => {
  const [category, setCategory] = useState<CareerCategory | 'all'>(targetRoleCategory || 'all');
  const [query, setQuery] = useState('');
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [addingResourceId, setAddingResourceId] = useState<string | null>(null);
  const [addedResourceIds, setAddedResourceIds] = useState<Set<string>>(() => new Set());
  const [existingResourceIds, setExistingResourceIds] = useState<Set<string>>(() => new Set());
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      void searchLearningResources(query, category)
        .then((items) => {
          if (active) setResources(items);
        })
        .catch((searchError: unknown) => {
          if (!active) return;
          setResources([]);
          setError(searchError instanceof Error ? searchError.message : 'Could not load the learning catalog.');
        })
        .finally(() => { if (active) setLoading(false); });
    }, query ? 250 : 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, category, reload]);

  const addResourceToPlan = async (resource: LearningResource) => {
    if (addingResourceId) return;
    setAddingResourceId(resource.id);
    setActionMessage('');
    try {
      const added = await onAddToPlan({ id: resource.id, title: resource.title, category: resource.category });
      if (added) setAddedResourceIds((current) => new Set(current).add(resource.id));
      else setExistingResourceIds((current) => new Set(current).add(resource.id));
      setActionMessage(added ? `${resource.title} added to your active roadmap.` : `${resource.title} is already in your roadmap history.`);
    } catch (actionError) {
      setActionMessage(actionError instanceof Error ? actionError.message : 'Could not add this resource to your roadmap.');
    } finally {
      setAddingResourceId(null);
    }
  };

  return (
    <section aria-labelledby="learning-resources-title" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <div className="m3-surface-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px' }}>
          <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: '42px', height: '42px', borderRadius: '13px', color: 'var(--md-primary)', background: 'var(--md-primary-container)' }}>
            <BookOpen size={20} />
          </span>
          <div>
            <h2 id="learning-resources-title" style={{ margin: '0 0 4px', color: 'var(--md-text-primary)', fontSize: '20px', fontWeight: 700 }}>Learning Resources</h2>
            <p style={{ margin: 0, color: 'var(--md-text-secondary)', fontSize: '13px' }}>
              {targetRole ? `Curated resources for ${targetRole}.` : 'Curated guides and docs for your career track.'}
            </p>
          </div>
        </div>

        <label style={{ display: 'block', position: 'relative', marginBottom: '14px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--md-text-muted)' }}><Search size={16} aria-hidden="true" /></span>
          <input
            aria-label="Search learning resources"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={120}
            placeholder="Search topics, tools, and skills"
            style={{ width: '100%', boxSizing: 'border-box', minHeight: '44px', border: '1px solid var(--md-outline)', borderRadius: '12px', background: 'var(--md-surface)', color: 'var(--md-text-primary)', padding: '0 14px 0 40px' }}
          />
        </label>

        <div role="group" aria-label="Filter learning resources by career category" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '3px' }}>
          {careerCategories.map((item) => {
            const selected = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(item.id as CareerCategory | 'all')}
                style={{ ...buttonStyle, color: selected ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)', background: selected ? 'var(--md-primary-container)' : 'var(--md-surface)', borderColor: selected ? 'transparent' : 'var(--md-outline)' }}
              >
                {item.id === 'all' ? 'All topics' : item.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && <CardGridSkeleton count={4} label="Searching learning resources" />}
      {!loading && error && (
        <div className="m3-surface-card" role="alert" style={{ color: 'var(--md-text-secondary)' }}>
          <p style={{ marginTop: 0 }}>{error}</p>
          <button type="button" onClick={() => setReload((value) => value + 1)} style={{ ...buttonStyle, borderRadius: '10px', color: 'var(--md-text-primary)', background: 'var(--md-surface)' }}>Try again</button>
        </div>
      )}
      {!loading && !error && resources.length === 0 && (
        <div className="m3-surface-card" role="status" style={{ color: 'var(--md-text-secondary)' }}>
          <strong style={{ color: 'var(--md-text-primary)' }}>No resources found</strong>
          <p style={{ marginBottom: 0 }}>Try a broader search or choose another career category.</p>
        </div>
      )}
      {!loading && !error && resources.length > 0 && (
        <>
          <p aria-live="polite" style={{ margin: '0 2px 12px', color: 'var(--md-text-muted)', fontSize: '12px' }}>{resources.length} resource{resources.length === 1 ? '' : 's'}{category === 'all' ? '' : ` · ${category}`}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '14px' }}>
            {resources.map((resource) => {
              const href = safeExternalUrl(resource.url);
              return (
                <article key={resource.id} className="m3-surface-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ color: 'var(--md-primary)', fontSize: '11px', fontWeight: 800 }}>{resource.category || 'Career skills'}</span>
                    <span style={{ borderRadius: '999px', background: 'var(--md-surface-variant)', padding: '4px 8px', color: 'var(--md-text-secondary)', fontSize: '10px', fontWeight: 700 }}>{resource.resource_type}</span>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 6px', color: 'var(--md-text-primary)', fontSize: '16px', lineHeight: 1.35 }}>{resource.title}</h3>
                    <p style={{ margin: 0, color: 'var(--md-text-secondary)', fontSize: '12px', lineHeight: 1.55 }}>{resource.description || 'A curated resource for your career learning plan.'}</p>
                  </div>
                  {resource.tags.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {resource.tags.slice(0, 4).map((tag) => <span key={tag} style={{ color: 'var(--md-text-muted)', border: '1px solid var(--md-outline)', borderRadius: '999px', padding: '3px 8px', fontSize: '10px' }}>{tag}</span>)}
                  </div>}
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderTop: '1px solid var(--md-outline)', paddingTop: '12px' }}>
                    <span style={{ color: 'var(--md-text-muted)', fontSize: '11px' }}>{resource.provider || 'Publisher'}</span>
                    {href ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--md-primary)', fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>Open resource <ExternalLink size={13} aria-hidden="true" /></a> : <span style={{ color: 'var(--md-text-muted)', fontSize: '11px' }}>Link unavailable</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => void addResourceToPlan(resource)}
                    disabled={addingResourceId !== null || addedResourceIds.has(resource.id) || existingResourceIds.has(resource.id)}
                    style={{ minHeight: '40px', border: '1px solid var(--md-outline)', borderRadius: '10px', background: addedResourceIds.has(resource.id) || existingResourceIds.has(resource.id) ? 'var(--md-surface-variant)' : 'var(--md-primary-container)', color: addedResourceIds.has(resource.id) || existingResourceIds.has(resource.id) ? 'var(--md-text-secondary)' : 'var(--md-on-primary-container)', fontSize: '12px', fontWeight: 800, cursor: addingResourceId === resource.id ? 'wait' : 'pointer' }}
                  >
                    {addingResourceId === resource.id ? 'Adding to plan…' : addedResourceIds.has(resource.id) ? 'Added to plan' : existingResourceIds.has(resource.id) ? 'Already in history' : 'Add to my plan'}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}
      {actionMessage && <p role="status" aria-live="polite" style={{ marginTop: '12px', color: 'var(--md-text-secondary)', fontSize: '12px' }}>{actionMessage}</p>}
    </section>
  );
};
