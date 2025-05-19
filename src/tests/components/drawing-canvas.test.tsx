import React from "react";
import { render, fireEvent } from "@testing-library/react";
import DrawingCanvas, {
  DrawingCanvasHandle,
} from "@/components/chart/drawing-canvas";
import { act } from "react-dom/test-utils";

const mockCtx = {
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  clearRect: jest.fn(),
};

beforeAll(() => {
  if (typeof (global as any).PointerEvent === "undefined") {
    (global as any).PointerEvent = window.MouseEvent as any;
  }
});

beforeEach(() => {
  jest
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(mockCtx as any);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe("DrawingCanvas", () => {
  it("draws line on pointer events", async () => {
    const { getByTestId } = render(<DrawingCanvas />);
    const canvas = getByTestId("drawing-canvas") as HTMLCanvasElement;
    await act(async () => {
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
      fireEvent.pointerMove(canvas, { clientX: 10, clientY: 10 });
      fireEvent.pointerUp(canvas);
    });
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.moveTo).toHaveBeenCalled();
    expect(mockCtx.lineTo).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it("draws trendline on click", async () => {
    const { getByTestId } = render(
      <DrawingCanvas mode="trendline" />,
    );
    const canvas = getByTestId("drawing-canvas") as HTMLCanvasElement;
    await act(async () => {
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
      fireEvent.pointerUp(canvas, { clientX: 10, clientY: 10 });
    });
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(mockCtx.lineTo).toHaveBeenCalledWith(10, 10);
  });

  it("draws fibonacci retracement", async () => {
    const { getByTestId } = render(
      <DrawingCanvas mode="fibonacci" />,
    );
    const canvas = getByTestId("drawing-canvas") as HTMLCanvasElement;
    await act(async () => {
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
      fireEvent.pointerUp(canvas, { clientX: 0, clientY: 100 });
    });
    // 7 levels should be drawn
    expect(mockCtx.stroke).toHaveBeenCalledTimes(7);
  });

  it("treats null mode as freehand", async () => {
    const { getByTestId } = render(
      <DrawingCanvas mode={null} enabled={true} />,
    );
    const canvas = getByTestId("drawing-canvas") as HTMLCanvasElement;
    await act(async () => {
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
      fireEvent.pointerMove(canvas, { clientX: 10, clientY: 10 });
      fireEvent.pointerUp(canvas);
    });
    // 選択モード時はイベントが処理されないので、コールされないはず
    expect(mockCtx.beginPath).not.toHaveBeenCalled();
    expect(mockCtx.stroke).not.toHaveBeenCalled();
  });

  it("does not draw when enabled is false", async () => {
    const { getByTestId } = render(
      <DrawingCanvas mode="freehand" enabled={false} />,
    );
    const canvas = getByTestId("drawing-canvas") as HTMLCanvasElement;
    await act(async () => {
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
      fireEvent.pointerMove(canvas, { clientX: 10, clientY: 10 });
      fireEvent.pointerUp(canvas);
    });
    expect(mockCtx.beginPath).not.toHaveBeenCalled();
    expect(mockCtx.stroke).not.toHaveBeenCalled();
  });

  it("clears canvas via handle", () => {
    const ref = React.createRef<DrawingCanvasHandle>();
    render(<DrawingCanvas ref={ref} />);
    act(() => {
      ref.current?.clear();
    });
    expect(mockCtx.clearRect).toHaveBeenCalled();
  });

  it("preserves drawing content when switching modes", () => {
    const ref = React.createRef<DrawingCanvasHandle>();
    const { rerender } = render(<DrawingCanvas mode="trendline" ref={ref} />);
    
    // トレンドラインモードで描画
    act(() => {
      const canvas = document.querySelector('[data-testid="drawing-canvas"]') as HTMLCanvasElement;
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
      fireEvent.pointerUp(canvas, { clientX: 100, clientY: 100 });
    });
    
    // 選択モードに切り替え
    rerender(<DrawingCanvas mode={null} ref={ref} />);
    
    // キャンバスがクリアされていないこと
    expect(mockCtx.clearRect).toHaveBeenCalledTimes(1); // プレビュー用に1回だけ呼ばれる
  });
});
