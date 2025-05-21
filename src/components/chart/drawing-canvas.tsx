"use client";

import { forwardRef } from "react";
import useDrawingCanvas, {
  UseDrawingCanvasProps,
} from "@/hooks/use-drawing-canvas";
import type { DrawingCanvasHandle } from "@/types/chart";
import { DRAWING_MODES } from "@/types/chart";

export interface DrawingCanvasProps extends UseDrawingCanvasProps {
  className?: string;
  onWheel?: (event: React.WheelEvent<HTMLCanvasElement>) => void;
}

function DrawingCanvas(
  { className, onWheel, ...options }: DrawingCanvasProps,
  ref: React.Ref<DrawingCanvasHandle>,
) {
  const {
    canvasRef,
    containerRef,
    eraserPosition,
    textInput,
    textInputRef,
    isDrawing,
    getCursorStyle,
    getEraserCursorStyle,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerEnter,
    handlePointerLeave,
    handleContainerMouseMove,
    handleTextChange,
    handleTextSubmit,
  } = useDrawingCanvas(options, ref);
  const { mode = DRAWING_MODES.FREEHAND, enabled = true, eraserSize = 30 } = options;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseMove={handleContainerMouseMove}
    >
      {mode === DRAWING_MODES.ERASER && eraserPosition && (
        <div
          className="absolute pointer-events-none rounded-full z-50"
          style={{
            width: eraserSize,
            height: eraserSize,
            transform: "translate(-50%, -50%)",
            left: `${eraserPosition.x}px`,
            top: `${eraserPosition.y}px`,
            opacity: isDrawing ? 0.8 : 0.6,
            boxShadow: "0 0 4px rgba(0, 0, 0, 0.5)",
            border: "3px dashed rgba(239, 68, 68, 0.8)",
            backgroundColor: "rgba(239, 68, 68, 0.2)",
          }}
          data-testid="eraser-cursor"
        >
          <div
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: "10px",
              height: "10px",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "2px",
                backgroundColor: "rgba(255, 0, 0, 0.8)",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            ></div>
            <div
              style={{
                position: "absolute",
                width: "2px",
                height: "100%",
                backgroundColor: "rgba(255, 0, 0, 0.8)",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            ></div>
          </div>
        </div>
      )}
      {textInput && (
        <div
          className="absolute z-50"
          style={{
            position: "absolute",
            left: `${textInput.x}px`,
            top: `${textInput.y}px`,
            zIndex: 9999,
          }}
          data-testid="text-input-container"
        >
          <input
            ref={textInputRef}
            value={textInput.text}
            onChange={handleTextChange}
            onBlur={handleTextSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleTextSubmit();
              }
              if (e.key === "Escape") {
                // setTextInput(null); // 必要に応じてキャンセル処理を追加
              }
            }}
            className="text-base border rounded shadow-md"
            style={{
              border: "3px solid red",
              backgroundColor: "white",
              color: "black",
              width: "200px",
              height: "40px",
              padding: "5px",
              fontSize: "16px",
            }}
            autoFocus
            placeholder="テキストを入力"
            data-testid="text-input"
          />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`${className ?? ""} ${getCursorStyle()}`}
        style={{
          zIndex: 10,
          width: "100%",
          height: "100%",
          touchAction: "none",
          pointerEvents: mode === null ? "none" : "auto",
          border:
            mode !== null && enabled
              ? "1px dashed rgba(239, 68, 68, 0.3)"
              : "none",
          ...getEraserCursorStyle(),
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onWheel={onWheel}
        data-testid="drawing-canvas"
      />
    </div>
  );
}

export default forwardRef(DrawingCanvas);
