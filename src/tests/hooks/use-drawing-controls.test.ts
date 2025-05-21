import { renderHook, act } from "@testing-library/react";
import React from "react";
import useDrawingControls from "@/hooks/use-drawing-controls";

describe("useDrawingControls", () => {
  it("changes mode when shortcut keys are pressed", () => {
    const containerRef = React.createRef<HTMLDivElement>();
    const { result } = renderHook(() => useDrawingControls({ containerRef }));

    act(() => {
      result.current.registerShortcuts();
    });

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "t", altKey: true }),
      );
    });
    expect(result.current.mode).toBe("trendline");

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "f", altKey: true }),
      );
    });
    expect(result.current.mode).toBe("fibonacci");

    act(() => {
      result.current.unregisterShortcuts();
    });

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "t", altKey: true }),
      );
    });

    // ショートカットが解除されたので、モードは変わらないはず
    expect(result.current.mode).toBe("fibonacci");
  });
});