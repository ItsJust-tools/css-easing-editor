import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EasingCanvas } from '@/tool/components/Canvas';
import { EasingToolbar } from '@/tool/components/Toolbar';
import { EasingSidebar } from '@/tool/components/Sidebar';
import { DEFAULT_STATE, PRESETS, toCssTiming } from '@/tool/tool-definition';
import type { EasingState } from '@/tool/types';

describe('EasingCanvas', () => {
  it('renders draggable handles and css output', () => {
    const onChange = vi.fn();
    render(<EasingCanvas state={DEFAULT_STATE} onChange={onChange} />);
    expect(screen.getByTestId('easing-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('handle-p1')).toBeInTheDocument();
    expect(screen.getByTestId('handle-p2')).toBeInTheDocument();
    expect(screen.getByTestId('css-output').textContent).toBe(toCssTiming(DEFAULT_STATE));
  });

  it('keyboard arrow keys update curve coordinates', () => {
    const onChange = vi.fn();
    render(
      <EasingCanvas state={{ p1: { x: 0.5, y: 0.5 }, p2: { x: 0.2, y: 1 } }} onChange={onChange} />
    );
    const p1 = screen.getByTestId('handle-p1');
    fireEvent.keyDown(p1, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalled();
    const arg = onChange.mock.calls[0]![0] as EasingState;
    expect(arg.p1.x).toBeGreaterThan(0.5);
    fireEvent.keyDown(p1, { key: 'ArrowLeft', shiftKey: true });
    const arg2 = onChange.mock.calls[1]![0] as EasingState;
    expect(arg2.p1.x).toBeLessThan(0.5);
  });

  it('pointer drag moves handle and clamps x in curve space', () => {
    const onChange = vi.fn();
    const state: EasingState = { p1: { x: 0.3, y: 0.2 }, p2: { x: 0.8, y: 1 } };
    render(<EasingCanvas state={state} onChange={onChange} />);
    const p1 = screen.getByTestId('handle-p1');
    fireEvent.pointerDown(p1);
    // simulate pointermove far right + top -> clamps to x=1, y max 1.5
    fireEvent.pointerMove(window, { clientX: 10000, clientY: -10000 });
    fireEvent.pointerUp(window);
    expect(onChange).toHaveBeenCalled();
    const arg = onChange.mock.calls[0]![0] as EasingState;
    expect(arg.p1.x).toBeLessThanOrEqual(1);
    expect(arg.p1.y).toBeLessThanOrEqual(1.5);
  });
});

describe('EasingToolbar number inputs', () => {
  it('clamps x to 0-1 and allows unbounded y', () => {
    const onChange = vi.fn();
    render(<EasingToolbar state={DEFAULT_STATE} onChange={onChange} />);
    const p1x = screen.getByTestId('p1-x') as HTMLInputElement;
    fireEvent.change(p1x, { target: { value: '3' } });
    let updater = onChange.mock.calls[0]![0] as (prev: EasingState) => EasingState;
    expect(updater(DEFAULT_STATE).p1.x).toBe(1);

    fireEvent.change(p1x, { target: { value: '-2' } });
    updater = onChange.mock.calls[1]![0] as (prev: EasingState) => EasingState;
    expect(updater(DEFAULT_STATE).p1.x).toBe(0);

    const p1y = screen.getByTestId('p1-y') as HTMLInputElement;
    fireEvent.change(p1y, { target: { value: '2.5' } });
    updater = onChange.mock.calls[2]![0] as (prev: EasingState) => EasingState;
    expect(updater(DEFAULT_STATE).p1.y).toBe(2.5); // y unbounded
  });
});

describe('EasingSidebar presets and utilities', () => {
  it('applies a preset replacing curve values', () => {
    const onApply = vi.fn();
    render(
      <EasingSidebar
        state={DEFAULT_STATE}
        onApply={onApply}
        onReset={() => {}}
        onUndo={() => {}}
        canUndo
      />
    );
    fireEvent.click(screen.getByTestId('preset-snappy'));
    expect(onApply).toHaveBeenCalledTimes(1);
    const applied = onApply.mock.calls[0]![0] as EasingState;
    const snappy = PRESETS.find((p) => p.id === 'snappy')!;
    expect(applied).toEqual(snappy.state);
  });

  it('mirror and reverse buttons transform the current curve', () => {
    const onApply = vi.fn();
    render(
      <EasingSidebar
        state={DEFAULT_STATE}
        onApply={onApply}
        onReset={() => {}}
        onUndo={() => {}}
        canUndo
      />
    );
    fireEvent.click(screen.getByTestId('mirror-curve'));
    const mirrored = onApply.mock.calls[0]![0] as EasingState;
    expect(mirrored.p1.x).toBeCloseTo(0.8);
    expect(mirrored.p2.x).toBeCloseTo(0.6);

    fireEvent.click(screen.getByTestId('reverse-curve'));
    const reversed = onApply.mock.calls[1]![0] as EasingState;
    expect(reversed.p1).toEqual(DEFAULT_STATE.p2);
    expect(reversed.p2).toEqual(DEFAULT_STATE.p1);
  });

  it('reset and undo buttons call handlers', () => {
    const onReset = vi.fn();
    const onUndo = vi.fn();
    render(
      <EasingSidebar
        state={DEFAULT_STATE}
        onApply={() => {}}
        onReset={onReset}
        onUndo={onUndo}
        canUndo={true}
      />
    );
    fireEvent.click(screen.getByTestId('reset-curve'));
    fireEvent.click(screen.getByTestId('undo-curve'));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('undo disabled when no history', () => {
    render(
      <EasingSidebar
        state={DEFAULT_STATE}
        onApply={() => {}}
        onReset={() => {}}
        onUndo={() => {}}
        canUndo={false}
      />
    );
    expect(screen.getByTestId('undo-curve')).toBeDisabled();
  });
});
