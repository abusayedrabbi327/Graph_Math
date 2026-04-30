import React from 'react';
import type { AppTheme } from '../theme';
import type { ChapterData } from '../types';
import chapter14 from '../../data/chapters/chapter_14.json';

interface ChapterSelectorProps {
  theme: AppTheme;
  activeChapter: ChapterData | null;
  onSelectChapter: (chapter: ChapterData | null) => void;
}

export function ChapterSelector({ theme, activeChapter, onSelectChapter }: ChapterSelectorProps) {
  const chapters = [
    { id: '14.6', name: 'Chapter 14.6: Triple Integrals', data: chapter14 as ChapterData }
  ];

  return (
    <div className="flex items-center" style={{ padding: '8px 16px', background: theme.bgPanel, borderBottom: `1px solid ${theme.border}` }}>
      <label style={{ fontSize: '12px', color: theme.textDim, marginRight: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Chapter View:
      </label>
      <select 
        style={{
          background: theme.bgInput,
          color: theme.textPrimary,
          border: `1px solid ${theme.borderLight}`,
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '13px',
          outline: 'none',
          cursor: 'pointer'
        }}
        value={activeChapter ? '14.6' : ''}
        onChange={(e) => {
          const val = e.target.value;
          if (!val) {
            onSelectChapter(null);
          } else {
            const ch = chapters.find(c => c.id === val);
            if (ch) onSelectChapter(ch.data);
          }
        }}
      >
        <option value="">None (Freeform Mode)</option>
        {chapters.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {activeChapter && (
        <div style={{ marginLeft: '16px', fontSize: '12px', color: theme.textSecondary }}>
          {activeChapter.metadata.title}
        </div>
      )}
    </div>
  );
}
