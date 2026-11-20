import type { Tool, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import type { BezierPoint, EasingState, Preset, PresetId } from './types';

export type { EasingState, BezierPoint, Preset, PresetId } from './types';

export const DEFAULT_STATE: EasingState = {
  p1: { x: 0.4, y: 0 },
  p2: { x: 0.2, y: 1 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampX(x: number): number {
  return clamp(Number(x) || 0, 0, 1);
}

function clampY(y: number): number {
  const n = Number(y);
  return Number.isFinite(n) ? n : 0;
}

export function makePreset(id: PresetId, label: string, p1: BezierPoint, p2: BezierPoint): Preset {
  return { id, label, state: { p1: { ...p1 }, p2: { ...p2 } } };
}

/**
 * Preset library. "bounce" is represented by a multi-hump approximation
 * using cubic-bezier control points that overshoot (y outside 0..1).
 */
export const PRESETS: Preset[] = [
  makePreset('linear', 'Linear', { x: 0, y: 0 }, { x: 1, y: 1 }),
  makePreset('ease', 'Ease', { x: 0.25, y: 0.1 }, { x: 0.25, y: 1 }),
  makePreset('ease-in', 'Ease In', { x: 0.42, y: 0 }, { x: 1, y: 1 }),
  makePreset('ease-out', 'Ease Out', { x: 0, y: 0 }, { x: 0.58, y: 1 }),
  makePreset('ease-in-out', 'Ease In Out', { x: 0.42, y: 0 }, { x: 0.58, y: 1 }),
  makePreset('bounce', 'Bounce', { x: 0.15, y: 0.9 }, { x: 0.35, y: 1.65 }),
  makePreset('snappy', 'Snappy', { x: 0.05, y: 1.25 }, { x: 0.25, y: 1 }),
  makePreset('anticipate', 'Anticipate', { x: 0.35, y: -0.4 }, { x: 0.9, y: 0.9 }),
];

export function formatCoord(n: number): string {
  const rounded = Number((Math.round(n * 100) / 100).toFixed(2));
  return String(rounded);
}

/** Build the CSS timing function string, e.g. cubic-bezier(0.4, 0, 0.2, 1) */
export function toCssTiming(state: EasingState): string {
  return `cubic-bezier(${formatCoord(state.p1.x)}, ${formatCoord(state.p1.y)}, ${formatCoord(
    state.p2.x
  )}, ${formatCoord(state.p2.y)})`;
}

/** Full transition snippet with a default 300ms duration and property. */
export function toCssSnippet(state: EasingState): string {
  return `transition: all 300ms ${toCssTiming(state)};`;
}

/** Mirror the curve horizontally: x values become 1 - x, points swap. */
export function mirrorCurve(state: EasingState): EasingState {
  const mx = (x: number) => clampX(Math.round((1 - x) * 100) / 100);
  return {
    p1: { x: mx(state.p2.x), y: state.p2.y },
    p2: { x: mx(state.p1.x), y: state.p1.y },
  };
}

/** Reverse curve direction (ease-out becomes ease-in style): swap points. */
export function reverseCurve(state: EasingState): EasingState {
  return {
    p1: { x: state.p2.x, y: state.p2.y },
    p2: { x: state.p1.x, y: state.p1.y },
  };
}

/** Normalize + clamp arbitrary coordinate inputs to a valid EasingState. */
export function normalizeState(input: Partial<EasingState> | undefined | null): EasingState {
  const p1 = input?.p1 ?? DEFAULT_STATE.p1;
  const p2 = input?.p2 ?? DEFAULT_STATE.p2;
  return {
    p1: { x: clampX(p1.x), y: clampY(p1.y) },
    p2: { x: clampX(p2.x), y: clampY(p2.y) },
  };
}

function isBezierPoint(value: unknown): value is BezierPoint {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<BezierPoint>;
  return typeof v.x === 'number' && typeof v.y === 'number';
}

function isEasingState(value: unknown): value is EasingState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<EasingState>;
  return isBezierPoint(v.p1) && isBezierPoint(v.p2);
}

export const easingTool: Tool<EasingState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig as unknown as Tool<EasingState>['config'],
  initialState: { ...DEFAULT_STATE, p1: { ...DEFAULT_STATE.p1 }, p2: { ...DEFAULT_STATE.p2 } },
  serialize: (state) => JSON.stringify(state),
  deserialize: (data): DeserializeResult<EasingState> => {
    try {
      if (isEasingState(data)) {
        return { success: true, data: normalizeState(data) };
      }
      return { success: false, error: 'Invalid data format: expected easing curve state' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deserialization error';
      return { success: false, error: `Failed to deserialize state: ${message}` };
    }
  },
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'jpeg', loader: () => import('./exporters/jpeg') },
    { format: 'webp', loader: () => import('./exporters/webp') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ],
};

/** Back-compat name used by tests and docs. */
export const easingToolDefinition = easingTool;
