'use client';

import type { BezierPoint, EasingState } from '../types';

interface ToolbarProps {
  state: EasingState;
  onChange: (updater: (prev: EasingState) => EasingState) => void;
}

interface HandleNumberInputProps {
  label: string;
  axis: 'x' | 'y';
  point: BezierPoint;
  onChange: (axis: 'x' | 'y', value: number) => void;
}

function HandleNumberInput({ label, axis, point, onChange }: HandleNumberInputProps) {
  const value = point[axis];
  const step = axis === 'x' ? 0.01 : 0.05;
  const min = axis === 'x' ? 0 : undefined;
  const max = axis === 'x' ? 1 : undefined;
  return (
    <label className="easing-number-input">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : 0}
        aria-label={`${label} ${axis.toUpperCase()}`}
        data-testid={`${label.toLowerCase().replace(' ', '-')}-${axis}`}
        onChange={(e) => onChange(axis, Number.parseFloat(e.target.value))}
      />
    </label>
  );
}

export function EasingToolbar({ state, onChange }: ToolbarProps) {
  const setPoint = (handle: 'p1' | 'p2', axis: 'x' | 'y', value: number) => {
    onChange((prev) => {
      const clamped = axis === 'x' ? Math.min(1, Math.max(0, value)) : value;
      return { ...prev, [handle]: { ...prev[handle], [axis]: clamped } };
    });
  };

  return (
    <div className="easing-toolbar" data-testid="easing-toolbar">
      <fieldset className="easing-toolbar-group">
        <legend>P1</legend>
        <HandleNumberInput
          label="P1"
          axis="x"
          point={state.p1}
          onChange={(a, v) => setPoint('p1', a, v)}
        />
        <HandleNumberInput
          label="P1"
          axis="y"
          point={state.p1}
          onChange={(a, v) => setPoint('p1', a, v)}
        />
      </fieldset>
      <fieldset className="easing-toolbar-group">
        <legend>P2</legend>
        <HandleNumberInput
          label="P2"
          axis="x"
          point={state.p2}
          onChange={(a, v) => setPoint('p2', a, v)}
        />
        <HandleNumberInput
          label="P2"
          axis="y"
          point={state.p2}
          onChange={(a, v) => setPoint('p2', a, v)}
        />
      </fieldset>
    </div>
  );
}

export default EasingToolbar;
