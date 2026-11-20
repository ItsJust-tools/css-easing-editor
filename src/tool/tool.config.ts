export const toolConfig = {
  id: '1795179874',
  name: 'CSS Easing Editor',
  category: 'Design',
  description:
    'Visually design CSS cubic-bezier easing curves with interactive handles, previews, and copy-ready output.',
  version: '1.0.0',
  exportFormats: ['png', 'pdf', 'json', 'jpeg', 'webp'] as (
    'png' | 'pdf' | 'json' | 'jpeg' | 'webp'
  )[],
  theme: { brand: 'CSS Easing Editor' },
  features: {
    export: true,
    autoSave: true,
    undoRedo: true,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
};

export const templateBaseVersion = '1.1.0';

export default toolConfig;
