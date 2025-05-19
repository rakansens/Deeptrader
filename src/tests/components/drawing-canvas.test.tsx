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

  it("clears canvas via handle", () => {
    const ref = React.createRef<DrawingCanvasHandle>();
    render(<DrawingCanvas ref={ref} />);
    act(() => {
      ref.current?.clear();
    });
    expect(mockCtx.clearRect).toHaveBeenCalled();
  });
});
