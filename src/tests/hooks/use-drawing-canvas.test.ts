import { renderHook, act } from "@testing-library/react";
import useDrawingCanvas from "@/hooks/use-drawing-canvas";
import React from "react";
import { DRAWING_MODES, type DrawingMode } from "@/types/chart";

describe("useDrawingCanvas", () => {
  it("updates eraser position on pointer enter and resets on mode change", () => {
    const ref = React.createRef<any>();
    const { result, rerender } = renderHook(
      (props: any) => useDrawingCanvas(props, ref),
      { initialProps: { mode: DRAWING_MODES[6] as DrawingMode, enabled: true } },
    );

    const canvas = document.createElement("canvas");
    Object.defineProperty(canvas, "width", { value: 100, writable: true });
    Object.defineProperty(canvas, "height", { value: 100, writable: true });
    act(() => {
      (
        result.current
          .canvasRef as React.MutableRefObject<HTMLCanvasElement | null>
      ).current = canvas;
      result.current.handlePointerEnter({
        currentTarget: canvas,
        clientX: 10,
        clientY: 20,
      } as any);
    });

    expect(result.current.eraserPosition).toEqual({ x: 10, y: 20 });

    act(() => {
      rerender({ mode: DRAWING_MODES[0] as DrawingMode, enabled: true });
    });
    expect(result.current.eraserPosition).toBeNull();
  });
});
