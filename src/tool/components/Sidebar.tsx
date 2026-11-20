'use client';

import { useState } from 'react';
import { PRESETS, toCssSnippet, toCssTiming, mirrorCurve, reverseCurve } from '../tool-definition';
import type { EasingState } from '../types';

interface SidebarProps {
  state: EasingState;
  onApply: (next: EasingState) => void;
  onReset: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

type CopyTarget = 'timing' | 'snippet';

export function EasingSidebar({ state, onApply, onReset, onUndo, canUndo }: SidebarProps) {
  const [copied, setCopied] = useState<CopyTarget | null>(null);

  const copy = async (target: CopyTarget) => {
    const text = target === 'timing' ? toCssTiming(state) : toCssSnippet(state);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(target);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  return (
    <aside className="easing-sidebar" data-testid="easing-sidebar">
      <section className="easing-sidebar-section">
        <h3>Presets</h3>
        <div className="easing-preset-grid">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="easing-preset-button"
              data-testid={`preset-${preset.id}`}
              onClick={() => onApply({ ...preset.state })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <section className="easing-sidebar-section">
        <h3>Utilities</h3>
        <div className="easing-util-row">
          <button
            type="button"
            data-testid="mirror-curve"
            onClick={() => onApply(mirrorCurve(state))}
          >
            Mirror
          </button>
          <button
            type="button"
            data-testid="reverse-curve"
            onClick={() => onApply(reverseCurve(state))}
          >
            Reverse
          </button>
          <button type="button" data-testid="undo-curve" onClick={onUndo} disabled={!canUndo}>
            Undo
          </button>
          <button type="button" data-testid="reset-curve" onClick={onReset}>
            Reset
          </button>
        </div>
      </section>

      <section className="easing-sidebar-section">
        <h3>Output</h3>
        <pre className="easing-output" data-testid="css-snippet">
          {`transition-timing-function: ${toCssTiming(state)};`}
        </pre>
        <button type="button" data-testid="copy-timing" onClick={() => copy('timing')}>
          {copied === 'timing' ? 'Copied!' : 'Copy timing function'}
        </button>
        <pre className="easing-output" data-testid="css-full-snippet">
          {toCssSnippet(state)}
        </pre>
        <button type="button" data-testid="copy-snippet" onClick={() => copy('snippet')}>
          {copied === 'snippet' ? 'Copied!' : 'Copy transition snippet'}
        </button>
      </section>
    </aside>
  );
}

export default EasingSidebar;
