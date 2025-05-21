"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DRAWING_MODES, type DrawingMode } from "@/types/chart";
import useToolPreview, { type Point } from "@/hooks/use-tool-preview";

interface UsePointerEventsOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  enabled: boolean;
  mode: DrawingMode | null;
  color: string;
  strokeWidth: number;
  eraserSize: number;
}

export function usePointerEvents({
  canvasRef,
  enabled,
  mode,
  color,
  strokeWidth,
  eraserSize,
}: UsePointerEventsOptions) {
  const drawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const startPoint = useRef<Point | null>(null);
  const savedCanvasState = useRef<ImageData | null>(null);
  const [eraserPosition, setEraserPosition] = useState<Point | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const actualMode = mode === null ? DRAWING_MODES.FREEHAND : mode;

  const getContext = useCallback(() => canvasRef.current?.getContext("2d"), [canvasRef]);
  const clearPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx || !startPoint.current) return;

    if (savedCanvasState.current) {
      ctx.putImageData(savedCanvasState.current, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [canvasRef, getContext]);

  const { preview, draw } = useToolPreview({
    canvasRef,
    color,
    strokeWidth,
    clearPreview,
  });

  const erase = useCallback(
    (x: number, y: number) => {
      const ctx = getContext();
      const canvas = canvasRef.current;
      if (!ctx || !canvas || !lastPoint.current) return;

      const radius = eraserSize / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.clearRect(x - radius, y - radius, eraserSize, eraserSize);
      ctx.restore();

      savedCanvasState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
    [eraserSize, canvasRef, getContext],
  );

  const handleTextSubmit = useCallback(() => {
    if (!textInput) return;
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) {
      setTextInput(null);
      return;
    }
    ctx.fillStyle = color;
    ctx.font = `${14}px Arial`;
    ctx.fillText(textInput.text, textInput.x, textInput.y);
    savedCanvasState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setTextInput(null);
  }, [textInput, color, canvasRef, getContext]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (textInput) {
        setTextInput({ ...textInput, text: e.target.value });
      }
    },
    [textInput],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!enabled || mode === null) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const canvas = canvasRef.current;
      const ctx = getContext();
      if (canvas && ctx) {
        savedCanvasState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }

      if (actualMode === DRAWING_MODES.TEXT) {
        setTextInput({ x: point.x, y: point.y, text: "" });
        return;
      }

      if (actualMode === DRAWING_MODES.FREEHAND || actualMode === DRAWING_MODES.ERASER) {
        drawing.current = true;
        lastPoint.current = point;
        if (actualMode === DRAWING_MODES.ERASER) {
          erase(point.x, point.y);
        }
      } else {
        startPoint.current = point;
      }
    },
    [enabled, mode, actualMode, canvasRef, getContext, erase],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!enabled || mode === null) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (mode === DRAWING_MODES.ERASER) {
        setEraserPosition({ x, y });
      }

      if (actualMode === DRAWING_MODES.FREEHAND && drawing.current) {
        const ctx = getContext();
        if (!ctx || !lastPoint.current) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPoint.current = { x, y };
      } else if (actualMode === DRAWING_MODES.ERASER && drawing.current) {
        erase(x, y);
        lastPoint.current = { x, y };
      } else if (startPoint.current) {
        preview(actualMode, startPoint.current, x, y);
      }
    },
    [enabled, mode, actualMode, erase, preview, getContext, color, strokeWidth],
  );

  const endDrawing = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!enabled || mode === null) return;

      if (actualMode === DRAWING_MODES.TEXT) {
        return;
      }

      if (actualMode === DRAWING_MODES.FREEHAND || actualMode === DRAWING_MODES.ERASER) {
        drawing.current = false;
        lastPoint.current = null;
        const canvas = canvasRef.current;
        const ctx = getContext();
        if (canvas && ctx) {
          savedCanvasState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
      } else if (startPoint.current) {
        const ctx = getContext();
        const canvas = canvasRef.current;
        if (!ctx || !canvas) {
          startPoint.current = null;
          return;
        }
        const rect = canvas.getBoundingClientRect();
        const end = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        clearPreview();
        draw(actualMode, startPoint.current, end.x, end.y);
        savedCanvasState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        startPoint.current = null;
      }
    },
    [enabled, mode, actualMode, draw, clearPreview, getContext],
  );

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (mode === DRAWING_MODES.ERASER) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setEraserPosition({ x, y });
      }
    },
    [mode],
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      endDrawing(e);
      if (mode === DRAWING_MODES.ERASER) {
        setEraserPosition(null);
      }
    },
    [endDrawing, mode],
  );

  const handleContainerMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (mode === DRAWING_MODES.ERASER) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setEraserPosition({ x, y });
        }
      }
    },
    [mode],
  );

  useEffect(() => {
    if (mode === DRAWING_MODES.ERASER && canvasRef.current) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setEraserPosition({ x, y });
        }
      };
      window.addEventListener("mousemove", handleGlobalMouseMove);
      return () => {
        window.removeEventListener("mousemove", handleGlobalMouseMove);
      };
    }
  }, [mode, canvasRef]);

  useEffect(() => {
    if (textInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput]);

  useEffect(() => {
    if (mode === DRAWING_MODES.ERASER) {
      const canvas = canvasRef.current;
      if (canvas) {
        const width = canvas.width / 2;
        const height = canvas.height / 2;
        setEraserPosition({ x: width, y: height });
      }
    } else {
      setEraserPosition(null);
    }
  }, [mode, canvasRef]);

  const getCursorStyle = useCallback(() => {
    if (!enabled) return "";
    switch (mode) {
      case null:
        return "cursor-default";
      case DRAWING_MODES.FREEHAND:
        return "cursor-pointer";
      case DRAWING_MODES.ERASER:
        return "cursor-not-allowed";
      case DRAWING_MODES.TEXT:
        return "cursor-text";
      default:
        return "cursor-crosshair";
    }
  }, [mode, enabled]);

  const getEraserCursorStyle = useCallback(() => {
    if (mode === DRAWING_MODES.ERASER) {
      return { cursor: "none" };
    }
    return {};
  }, [mode]);

  return {
    drawing,
    eraserPosition,
    textInput,
    textInputRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: endDrawing,
    handlePointerEnter,
    handlePointerLeave,
    handleContainerMouseMove,
    handleTextChange,
    handleTextSubmit,
    getCursorStyle,
    getEraserCursorStyle,
  };
}

export default usePointerEvents;
