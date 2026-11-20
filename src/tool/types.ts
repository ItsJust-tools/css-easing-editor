export interface BezierPoint {
  x: number;
  y: number;
}

export interface EasingState {
  /** First control point P1 */
  p1: BezierPoint;
  /** Second control point P2 */
  p2: BezierPoint;
}

export type PresetId =
  'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'snappy' | 'anticipate';

export interface Preset {
  id: PresetId;
  label: string;
  state: EasingState;
}

/** @deprecated legacy notepad compatibility shim */
export interface ToolState {
  content?: string;
}
