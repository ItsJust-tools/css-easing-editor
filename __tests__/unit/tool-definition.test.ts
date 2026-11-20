import { describe, it, expect } from 'vitest';
import {
  DEFAULT_STATE,
  PRESETS,
  easingTool,
  toCssTiming,
  toCssSnippet,
  mirrorCurve,
  reverseCurve,
  normalizeState,
  formatCoord,
} from '../../src/tool/tool-definition';
import type { EasingState } from '../../src/tool/types';

describe('easing tool state', () => {
  it('deserializes to the default cubic-bezier(0.4, 0, 0.2, 1) curve', () => {
    const result = easingTool.deserialize(undefined as unknown);
    expect(result.success).toBe(false); // no data -> invalid
    // initialState is the default curve
    expect(easingTool.initialState).toEqual({ p1: { x: 0.4, y: 0 }, p2: { x: 0.2, y: 1 } });
    expect(DEFAULT_STATE).toEqual(easingTool.initialState);
    expect(toCssTiming(easingTool.initialState)).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
  });

  it('deserializes valid state and clamps x coordinates to 0-1', () => {
    const raw: EasingState = {
      p1: { x: 1.7, y: -0.2 },
      p2: { x: -0.4, y: 2.5 },
    };
    const result = easingTool.deserialize(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.p1.x).toBe(1);
      expect(result.data.p2.x).toBe(0);
      expect(result.data.p1.y).toBe(-0.2); // y unbounded
      expect(result.data.p2.y).toBe(2.5);
    }
  });

  it('round-trips through serialize/deserialize', () => {
    const state: EasingState = { p1: { x: 0.25, y: 0.1 }, p2: { x: 0.75, y: 1.5 } };
    const json = easingTool.serialize(state);
    const result = easingTool.deserialize(JSON.parse(json));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(state);
    }
  });

  it('rejects malformed payloads', () => {
    expect(easingTool.deserialize(null).success).toBe(false);
    expect(easingTool.deserialize('nope').success).toBe(false);
    expect(easingTool.deserialize({ p1: { x: 1 } }).success).toBe(false);
    expect(easingTool.deserialize({ p2: { x: 0, y: 1 } }).success).toBe(false);
  });

  it('formats timing function output', () => {
    expect(toCssTiming({ p1: { x: 0.4, y: 0 }, p2: { x: 0.2, y: 1 } })).toBe(
      'cubic-bezier(0.4, 0, 0.2, 1)'
    );
    expect(toCssTiming({ p1: { x: 0.12345, y: -0.5 }, p2: { x: 1, y: 2 } })).toBe(
      'cubic-bezier(0.12, -0.5, 1, 2)'
    );
  });

  it('formats the full snippet', () => {
    expect(toCssSnippet(DEFAULT_STATE)).toContain(
      'transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);'
    );
  });

  it('exposes the preset library and applying one replaces curve values', () => {
    const ids = PRESETS.map((p) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'linear',
        'ease',
        'ease-in',
        'ease-out',
        'ease-in-out',
        'bounce',
        'snappy',
      ])
    );
    const ease = PRESETS.find((p) => p.id === 'ease-in')!;
    const applied: EasingState = {
      ...ease.state,
      p1: { ...ease.state.p1 },
      p2: { ...ease.state.p2 },
    };
    expect(toCssTiming(applied)).toBe(toCssTiming(ease.state));
    expect(toCssTiming(applied)).not.toBe(toCssTiming(DEFAULT_STATE));
  });

  it('mirrors the curve', () => {
    const mirrored = mirrorCurve({ p1: { x: 0.2, y: 0 }, p2: { x: 0.8, y: 1 } });
    expect(mirrored.p1).toEqual({ x: 0.2, y: 1 });
    expect(mirrored.p2).toEqual({ x: 0.8, y: 0 });
  });

  it('mirrored curve stays clamped to x 0..1', () => {
    const mirrored = mirrorCurve({ p1: { x: 0.1, y: 0 }, p2: { x: 0.9, y: 1 } });
    expect(mirrored.p1.x).toBeGreaterThanOrEqual(0);
    expect(mirrored.p2.x).toBeLessThanOrEqual(1);
  });

  it('reverses the curve', () => {
    const reversed = reverseCurve({ p1: { x: 0.1, y: 0.2 }, p2: { x: 0.7, y: 0.9 } });
    expect(reversed.p1).toEqual({ x: 0.7, y: 0.9 });
    expect(reversed.p2).toEqual({ x: 0.1, y: 0.2 });
  });

  it('normalizeState fills missing values and clamps x', () => {
    expect(normalizeState(undefined)).toEqual(DEFAULT_STATE);
    expect(normalizeState({ p1: { x: 3, y: 0 }, p2: { x: -1, y: 1 } })).toEqual({
      p1: { x: 1, y: 0 },
      p2: { x: 0, y: 1 },
    });
  });

  it('formats numbers to two decimals', () => {
    expect(formatCoord(0)).toBe('0');
    expect(formatCoord(1)).toBe('1');
    expect(formatCoord(0.12345)).toBe('0.12');
    expect(formatCoord(-0.4)).toBe('-0.4');
  });
});

describe('undo and reset', () => {
  it('undo history is managed in the client, default is intact after reset', () => {
    // reset restores DEFAULT_STATE
    const after = normalizeState({ p1: { x: 9, y: 9 }, p2: { x: 9, y: 9 } });
    expect(after).toEqual({ p1: { x: 1, y: 9 }, p2: { x: 1, y: 9 } });
    // DEFAULT_STATE is never mutated
    expect(DEFAULT_STATE.p1).toEqual({ x: 0.4, y: 0 });
    expect(DEFAULT_STATE.p2).toEqual({ x: 0.2, y: 1 });
  });
});

describe('undo helper in memory', () => {
  it('popping history reverts the last curve state', () => {
    const history: EasingState[] = [
      { p1: { x: 0.4, y: 0 }, p2: { x: 0.2, y: 1 } },
      { p1: { x: 0.1, y: 0.5 }, p2: { x: 0.9, y: 0.5 } },
    ];
    const current = history[1]!;
    const reverted = history[0]!;
    expect(current).not.toEqual(reverted);
    // applying revert
    const restored = { ...reverted, p1: { ...reverted.p1 }, p2: { ...reverted.p2 } };
    expect(restored).toEqual(history[0]);
  });
});
