'use client';

import { useCallback, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { ToolShell, useTool, ImportExport } from '@itsjust/core';
import {
  toolConfig,
  templateBaseVersion,
  EasingCanvas,
  EasingToolbar,
  EasingSidebar,
} from '@/tool';
import { easingTool, DEFAULT_STATE, type EasingState } from '@/tool/tool-definition';
import type { EasingState as EasingStateType } from '@/tool/types';

const HISTORY_LIMIT = 50;

export default function ToolClient() {
  const ToolShellCompat = ToolShell as unknown as ComponentType<Record<string, unknown>>;
  const canvasRef = useRef<HTMLDivElement>(null);
  const tool = useTool<EasingState>(easingTool, canvasRef);
  const setToolData = tool.state.setData;
  const showToast = tool.toast;
  const [history, setHistory] = useState<EasingState[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > 768
  );
  const state = tool.state.data;

  const pushHistory = useCallback((prev: EasingStateType) => {
    setHistory((h) =>
      [...h, { ...prev, p1: { ...prev.p1 }, p2: { ...prev.p2 } }].slice(-HISTORY_LIMIT)
    );
  }, []);

  const applyChange = useCallback(
    (next: EasingStateType) => {
      setToolData((prev: EasingStateType) => {
        pushHistory(prev);
        return next;
      });
    },
    [pushHistory, setToolData]
  );

  const applyUpdater = useCallback(
    (updater: (prev: EasingStateType) => EasingStateType) => {
      setToolData((prev: EasingStateType) => {
        pushHistory(prev);
        return updater(prev);
      });
    },
    [pushHistory, setToolData]
  );

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const previous = h[h.length - 1]!;
      setToolData(() => previous);
      return h.slice(0, -1);
    });
  }, [setToolData]);

  const handleReset = useCallback(() => {
    setToolData((prev: EasingStateType) => {
      pushHistory(prev);
      return { ...DEFAULT_STATE, p1: { ...DEFAULT_STATE.p1 }, p2: { ...DEFAULT_STATE.p2 } };
    });
  }, [pushHistory, setToolData]);

  const toolbarContent = (
    <>
      <EasingToolbar state={state} onChange={applyUpdater} />
      <ImportExport
        formats={tool.supportedFormats}
        onExport={tool.handleExport}
        onImport={tool.importFromFile}
        isImporting={tool.isImporting}
      />
    </>
  );

  const sidebarContent = (
    <EasingSidebar
      state={state}
      onApply={applyChange}
      onReset={handleReset}
      onUndo={handleUndo}
      canUndo={history.length > 0}
    />
  );

  const canvasContent = <EasingCanvas state={state} onChange={applyChange} />;

  const statusBarContent = (
    <>
      <span className="status-slot status-slot-tool-version">Tool v{toolConfig.version}</span>
      <span className="status-slot status-slot-template-version">
        Template v{templateBaseVersion}
      </span>
    </>
  );

  return (
    <ToolShellCompat
      config={toolConfig as unknown as Record<string, unknown>}
      actions={useMemo(() => tool.toolbarActions, [tool.toolbarActions])}
      sidebarOpen={sidebarOpen}
      onSidebarChange={setSidebarOpen}
      toolbar={toolbarContent}
      sidebar={sidebarContent}
      canvas={canvasContent}
      statusBar={statusBarContent}
    >
      {null as unknown as ReactNode}
    </ToolShellCompat>
  );
}
