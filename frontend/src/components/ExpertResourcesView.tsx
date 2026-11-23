import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  FileText,
  FolderOpen,
  Link2,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import type { ExpertResource } from '../types';
import {
  expertRepository,
  formatFileSize,
  validateExpertResourceFile,
} from '../features/experts/expertRepository';

interface Props {
  expertId: string;
  onToast: (msg: string) => void;
}

export const ExpertResourcesView: React.FC<Props> = ({ expertId, onToast }) => {
  const [resources, setResources] = useState<ExpertResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<'file' | 'link'>('file');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void expertRepository
      .listMyExpertResources(expertId)
      .then((rows) => {
        if (active) setResources(rows);
      })
      .catch((err) => {
        if (active) onToast(err instanceof Error ? err.message : 'Could not load resources.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [expertId, onToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const err = validateExpertResourceFile(file);
    if (err) {
      onToast(err);
      return;
    }
    setSelectedFile(file);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      onToast('Enter a title for this resource (at least 2 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      let created: ExpertResource;
      if (mode === 'file') {
        if (!selectedFile) {
          onToast('Choose a file to upload.');
          setIsSubmitting(false);
          return;
        }
        created = await expertRepository.uploadExpertResourceFile(
          expertId,
          title,
          description,
          selectedFile
        );
      } else {
        created = await expertRepository.addExpertResourceLink(
          expertId,
          title,
          description,
          externalUrl
        );
      }
      setResources((prev) => [created, ...prev]);
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setExternalUrl('');
      onToast('Resource uploaded! Learners who book your consultation will unlock it automatically.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not save resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpen = async (resource: ExpertResource) => {
    try {
      if (resource.resource_type === 'link' && resource.external_url) {
        window.open(resource.external_url, '_blank', 'noopener,noreferrer');
        return;
      }
      if (resource.storage_path) {
        const url = await expertRepository.getExpertResourceSignedUrl(resource.storage_path);
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not open resource.');
    }
  };

  const handleDelete = async (resource: ExpertResource) => {
    try {
      await expertRepository.deleteExpertResource(resource);
      setResources((prev) => prev.filter((r) => r.id !== resource.id));
      onToast('Resource removed.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not delete resource.');
    }
  };

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="m3-surface-card" style={{ display: 'grid', gap: '14px', padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderOpen size={18} color="var(--md-primary)" /> Consultation Files &amp; Resources
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--md-text-secondary)' }}>
              Upload templates, playbooks, PDFs, slides, or links. Anyone who purchases your consultation automatically unlocks them.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setMode('file')}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                border: `1px solid ${mode === 'file' ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                background: mode === 'file' ? 'var(--md-primary)' : 'var(--md-surface-variant)',
                color: mode === 'file' ? '#FFFFFF' : 'var(--md-text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Upload size={13} /> Upload File
            </button>
            <button
              type="button"
              onClick={() => setMode('link')}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                border: `1px solid ${mode === 'link' ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                background: mode === 'link' ? 'var(--md-primary)' : 'var(--md-surface-variant)',
                color: mode === 'link' ? '#FFFFFF' : 'var(--md-text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Link2 size={13} /> Add Resource Link
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '5px' }}>
              Resource Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. System Design Cheat Sheet / Architecture Kit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--md-outline)',
                background: 'var(--md-surface-variant)',
                color: 'var(--md-text-primary)',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {mode === 'file' ? (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '5px' }}>
                Select File (max 15 MB) *
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px dashed var(--md-outline-variant)',
                  background: 'var(--md-surface-variant)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--md-text-primary)',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})` : 'Choose PDF, DOCX, PPTX, ZIP, Image…'}
                </span>
                <Upload size={14} color="var(--md-primary)" style={{ flexShrink: 0 }} />
                <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>
          ) : (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '5px' }}>
                Resource URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://notion.so/... or https://github.com/..."
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-outline)',
                  background: 'var(--md-surface-variant)',
                  color: 'var(--md-text-primary)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '5px' }}>
            Description (visible to learners before &amp; after booking)
          </label>
          <input
            type="text"
            placeholder="Briefly explain what mentees get in this file or resource..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--md-outline)',
              background: 'var(--md-surface-variant)',
              color: 'var(--md-text-primary)',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--md-success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={14} /> Protected by RLS: only buyers of your consultation can download
          </span>
          <button
            type="submit"
            className="btn-m3-primary"
            disabled={isSubmitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px' }}
          >
            <Plus size={15} />
            <span>{isSubmitting ? 'Uploading...' : mode === 'file' ? 'Upload Resource File' : 'Save Resource Link'}</span>
          </button>
        </div>
      </form>

      {/* Uploaded Resources List */}
      <section className="m3-surface-card" style={{ display: 'grid', gap: '12px', padding: '18px' }}>
        <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800 }}>
          Uploaded Consultation Resources ({resources.length})
        </h3>

        {isLoading ? (
          <div style={{ fontSize: '13px', color: 'var(--md-text-muted)' }}>Loading your resources...</div>
        ) : resources.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--md-text-secondary)', padding: '12px 0' }}>
            No resources uploaded yet. Add playbooks, templates, or files above to boost learner bookings!
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {resources.map((res) => (
              <div
                key={res.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--md-outline)',
                  background: 'var(--md-surface-variant)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '9px',
                      background: 'var(--md-primary-container)',
                      color: 'var(--md-primary)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {res.resource_type === 'file' ? <FileText size={16} /> : <Link2 size={16} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                      {res.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                      {res.resource_type === 'file'
                        ? `${res.file_name || 'File'}${res.file_size_bytes ? ` · ${formatFileSize(res.file_size_bytes)}` : ''}`
                        : res.external_url}
                      {res.description ? ` — ${res.description}` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-m3-white"
                    onClick={() => void handleOpen(res)}
                    style={{ padding: '6px 11px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ExternalLink size={13} /> Open
                  </button>
                  <button
                    type="button"
                    aria-label="Delete resource"
                    onClick={() => void handleDelete(res)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--md-outline)',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      color: 'var(--md-error)',
                      display: 'inline-flex',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
