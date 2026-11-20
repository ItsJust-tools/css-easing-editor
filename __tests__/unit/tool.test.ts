import { describe, it, expect } from 'vitest';
import {
  easingTool,
  toCssTiming,
  mirrorCurve,
  reverseCurve,
  normalizeState,
} from '../../src/tool/tool-definition';
import type { EasingState } from '../../src/tool/types';

describe('easing tool definition', () => {
  const def = easingTool;

  it('initializes with the default curve cubic-bezier(0.4, 0, 0.2, 1)', () => {
    expect(toCssTiming(def.initialState)).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
  });

  it('serializes and deserializes state', () => {
    const state: EasingState = { p1: { x: 0.3, y: -0.2 }, p2: { x: 0.9, y: 1.4 } };
    const result = def.deserialize(JSON.parse(def.serialize(state)));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(state);
  });

  it('clamps x coordinates on deserialize', () => {
    const result = def.deserialize({ p1: { x: 5, y: 0 }, p2: { x: -5, y: 1 } });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.p1.x).toBe(1);
      expect(result.data.p2.x).toBe(0);
    }
  });

  it('rejects invalid payloads', () => {
    expect(def.deserialize(null).success).toBe(false);
    expect(def.deserialize({}).success).toBe(false);
  });

  it('transforms curves with mirror/reverse/normalize', () => {
    expect(mirrorCurve({ p1: { x: 0.2, y: 0 }, p2: { x: 0.8, y: 1 } })).toEqual({
      p1: { x: 0.2, y: 1 },
      p2: { x: 0.8, y: 0 },
    });
    expect(reverseCurve({ p1: { x: 0.1, y: 0 }, p2: { x: 0.9, y: 1 } })).toEqual({
      p1: { x: 0.9, y: 1 },
      p2: { x: 0.1, y: 0 },
    });
    expect(normalizeState(undefined)).toEqual(def.initialState);
  });
});
