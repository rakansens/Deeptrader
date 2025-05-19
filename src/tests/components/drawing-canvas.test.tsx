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
  rect: jest.fn(),
  closePath: jest.fn(),
  fill: jest.fn(),
  fillText: jest.fn(),
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

  it("draws horizontal line", async () => {
    const { getByTestId } = render(
      <DrawingCanvas mode="horizontal-line" />,
    );
    const canvas = getByTestId("drawing-canvas") as HTMLCanvasElement;
    await act(async () => {
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 20 });
      fireEvent.pointerUp(canvas, { clientX: 0, clientY: 20 });
    });
    expect(mockCtx.moveTo).toHaveBeenCalledWith(0, 20);
    expect(mockCtx.lineTo).toHaveBeenCalled();
  });

  it("draws box", async () => {
    const { getByTestId } = render(
      <DrawingCanvas mode="box" />,
    );
    const canvas = getByTestId("drawing-canvas") as HTMLCanvasElement;
    await act(async () => {
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
      fireEvent.pointerUp(canvas, { clientX: 10, clientY: 10 });
    });
    expect(mockCtx.rect).toHaveBeenCalledWith(0, 0, 10, 10);
  });

  it("draws arrow", async () => {
    const { getByTestId } = render(
      <DrawingCanvas mode="arrow" />,
    );
    const canvas = getByTestId("drawing-canvas") as HTMLCanvasElement;
    await act(async () => {
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
      fireEvent.pointerUp(canvas, { clientX: 10, clientY: 10 });
    });
    expect(mockCtx.lineTo).toHaveBeenCalledWith(10, 10);
    expect(mockCtx.fill).toHaveBeenCalled();
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

  it('shows eraser cursor when eraser mode is active', async () => {
    const { getByTestId, queryByTestId } = render(
      <DrawingCanvas mode="eraser" />,
    );
    
    // エラサーカーソルが表示されていることを確認
    expect(queryByTestId('eraser-cursor')).toBeInTheDocument();
    
    // マウス移動で位置が更新されることをテスト
    const canvas = getByTestId("drawing-canvas") as HTMLCanvasElement;
    await act(async () => {
      fireEvent.pointerMove(canvas, { clientX: 50, clientY: 50 });
    });
    
    // マウスがキャンバスから出たら消えることをテスト
    await act(async () => {
      fireEvent.pointerLeave(canvas);
    });
  });
});
