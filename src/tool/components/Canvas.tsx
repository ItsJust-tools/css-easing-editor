'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EasingState } from '../types';
import { toCssTiming } from '../tool-definition';

/** Logical curve space is 0..1 on both axes; rendered via padding box. */
interface CanvasProps {
  state: EasingState;
  onChange: (state: EasingState) => void;
}

const HANDLE_RADIUS = 9; // px, hit target is larger

export function EasingCanvas({ state, onChange }: CanvasProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'p1' | 'p2' | null>(null);
  const [focused, setFocused] = useState<'p1' | 'p2' | null>(null);

  const toPercent = (v: number) => `${v * 100}%`;

  const pointFromEvent = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const el = surfaceRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = 1 - (clientY - rect.top) / rect.height;
      return {
        x: Math.min(1, Math.max(0, x)),
        y: Math.min(1.5, Math.max(-0.5, y)),
      };
    },
    []
  );

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent) => {
      const pt = pointFromEvent(e.clientX, e.clientY);
      if (!pt) return;
      onChange({
        ...state,
        [dragging]: pt,
      } as EasingState);
    };
    const handleUp = () => setDragging(null);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragging, onChange, pointFromEvent, state]);

  /** Keyboard nudging of the focused handle (accessible dragging). */
  const handleKeyDown = (handle: 'p1' | 'p2') => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.01;
    const pt = state[handle];
    let next: { x: number; y: number } | null = null;
    switch (e.key) {
      case 'ArrowLeft':
        next = { x: Math.max(0, pt.x - step), y: pt.y };
        break;
      case 'ArrowRight':
        next = { x: Math.min(1, pt.x + step), y: pt.y };
        break;
      case 'ArrowUp':
        next = { x: pt.x, y: pt.y + step };
        break;
      case 'ArrowDown':
        next = { x: pt.x, y: pt.y - step };
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange({ ...state, [handle]: next } as EasingState);
  };

  const renderHandle = (handle: 'p1' | 'p2') => {
    const pt = state[handle];
    const isFocused = focused === handle || dragging === handle;
    return (
      <button
        type="button"
        role="slider"
        aria-label={`${handle === 'p1' ? 'P1' : 'P2'} control handle`}
        aria-valuetext={`x ${pt.x.toFixed(2)}, y ${pt.y.toFixed(2)}`}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={pt.x}
        data-testid={`handle-${handle}`}
        className={`easing-handle ${isFocused ? 'easing-handle-active' : ''}`}
        style={{ left: toPercent(pt.x), top: toPercent(1 - pt.y) }}
        onPointerDown={(e) => {
          e.preventDefault();
          setDragging(handle);
        }}
        onKeyDown={handleKeyDown(handle)}
        onFocus={() => setFocused(handle)}
        onBlur={() => setFocused(null)}
      />
    );
  };

  const cssTiming = toCssTiming(state);
  const duration = '600ms';

  return (
    <div className="easing-canvas" data-testid="easing-canvas">
      <div className="easing-canvas-grid">
        <div className="easing-surface" ref={surfaceRef} data-testid="easing-surface">
          <svg
            className="easing-curve"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line className="easing-guide" x1="0" y1="100" x2="100" y2="0" />
            {state.p1.y < 0 || state.p1.y > 1 || state.p2.y < 0 || state.p2.y > 1 ? null : (
              <>
                <line
                  className="easing-line"
                  x1="0"
                  y1="100"
                  x2={state.p1.x * 100}
                  y2={(1 - state.p1.y) * 100}
                />
                <line
                  className="easing-line"
                  x1="100"
                  y1="0"
                  x2={state.p2.x * 100}
                  y2={(1 - state.p2.y) * 100}
                />
              </>
            )}
            <path
              className="easing-path"
              d={`M 0 100 C ${state.p1.x * 100} ${(1 - state.p1.y) * 100} ${
                state.p2.x * 100
              } ${(1 - state.p2.y) * 100} 100 0`}
            />
          </svg>
          {renderHandle('p1')}
          {renderHandle('p2')}
        </div>
      </div>

      <div className="easing-previews">
        <div
          className="easing-preview easing-preview-position"
          data-testid="preview-position"
          style={{ transitionTimingFunction: cssTiming, transitionDuration: duration }}
        >
          <span className="easing-preview-label">Position</span>
        </div>
        <div
          className="easing-preview easing-preview-scale"
          data-testid="preview-scale"
          style={{ transitionTimingFunction: cssTiming, transitionDuration: duration }}
        >
          <span className="easing-preview-label">Scale</span>
        </div>
        <div
          className="easing-preview easing-preview-opacity"
          data-testid="preview-opacity"
          style={{ transitionTimingFunction: cssTiming, transitionDuration: duration }}
        >
          <span className="easing-preview-label">Opacity</span>
        </div>
      </div>

      <p className="easing-readout" data-testid="css-output">
        {cssTiming}
      </p>
    </div>
  );
}

export default EasingCanvas;
