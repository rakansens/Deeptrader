"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { DrawingMode, DrawingCanvasHandle } from "@/types/chart";

const SHORTCUT_MAP: Record<string, DrawingMode> = {
  t: "trendline",
  f: "fibonacci",
};

export interface UseDrawingControlsOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  drawingEnabled?: boolean;
}

export function useDrawingControls({
  containerRef,
  drawingEnabled = true,
}: UseDrawingControlsOptions) {
  const drawingRef = useRef<DrawingCanvasHandle>(null);
  const [mode, setMode] = useState<DrawingMode | null>(null);
  const [eraserSize, setEraserSize] = useState(30);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(1);
  const [showSidebar, setShowSidebar] = useState(false);

  const toggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev);
  }, []);

  const handleModeChange = useCallback((newMode: DrawingMode | null) => {
    setMode(newMode);
  }, []);

  const handleClearDrawing = useCallback(() => {
    drawingRef.current?.clear();
  }, []);

  const handleKeyDownRef = useRef((e: KeyboardEvent) => {
    if (!e.altKey) return;
    const key = e.key.toLowerCase();
    if (SHORTCUT_MAP[key]) {
      e.preventDefault();
      setMode(SHORTCUT_MAP[key]);
    }
  });

  useEffect(() => {
    handleKeyDownRef.current = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const key = e.key.toLowerCase();
      if (SHORTCUT_MAP[key]) {
        e.preventDefault();
        setMode(SHORTCUT_MAP[key]);
      }
    };
  }, []);

  const registerShortcuts = useCallback(() => {
    window.addEventListener("keydown", handleKeyDownRef.current);
  }, []);

  const unregisterShortcuts = useCallback(() => {
    window.removeEventListener("keydown", handleKeyDownRef.current);
  }, []);

  useEffect(() => {
    if (!drawingEnabled) {
      drawingRef.current?.clear();
    }
  }, [drawingEnabled]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      e.preventDefault();
      const cloned = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        deltaMode: e.deltaMode,
        clientX: e.clientX,
        clientY: e.clientY,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      });
      containerRef.current.dispatchEvent(cloned);
    },
    [containerRef],
  );

  useEffect(() => {
    return () => {
      unregisterShortcuts();
    };
  }, [unregisterShortcuts]);

  return {
    drawingRef,
    mode,
    eraserSize,
    strokeWidth,
    opacity,
    showSidebar,
    setEraserSize,
    setStrokeWidth,
    setOpacity,
    handleModeChange,
    handleClearDrawing,
    toggleSidebar,
    handleWheel,
    registerShortcuts,
    unregisterShortcuts,
  };
}

export default useDrawingControls;
