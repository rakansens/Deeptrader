"use client";

import { useRef, useEffect, useImperativeHandle, useState } from "react";
import { logger } from "@/lib/logger";
import type { DrawingCanvasHandle, DrawingMode } from "@/types/chart";
import { DRAWING_MODES } from "@/types/chart";
import { drawFreehand } from "@/hooks/use-freehand-tool";
import {
  previewTrendline,
  drawTrendline,
} from "@/hooks/use-trendline-tool";
import {
  previewFibonacci,
  drawFibonacci,
} from "@/hooks/use-fibonacci-tool";
import {
  previewHorizontalLine,
  drawHorizontalLine,
} from "@/hooks/use-horizontal-line-tool";
import { previewBox, drawBox } from "@/hooks/use-box-tool";
import { previewArrow, drawArrow } from "@/hooks/use-arrow-tool";

const {
  FREEHAND,
  TRENDLINE,
  FIBONACCI,
  HORIZONTAL_LINE,
  BOX,
  ARROW,
  TEXT,
  RULER,
  ERASER,
} = DRAWING_MODES;

/**
 * チャート上に手描きできるキャンバスコンポーネント
 */
export interface UseDrawingCanvasProps {
  /** 描画を有効にするか */
  enabled?: boolean;
  /** 線の色 */
  color?: string;
  /** 線の太さ */
  strokeWidth?: number;
  /** 描画モード */
  mode?: DrawingMode | null;
  /** 消しゴムサイズ */
  eraserSize?: number;
}

export function useDrawingCanvas(
  {
    enabled = true,
    color = "#ef4444",
    strokeWidth = 2,
    mode = DRAWING_MODES.FREEHAND,
    eraserSize = 30,
  }: UseDrawingCanvasProps,
  ref: React.Ref<DrawingCanvasHandle>,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  // 描画内容を保存するための変数
  const savedCanvasState = useRef<ImageData | null>(null);
  // 消しゴムの現在位置を追跡するための状態
  const [eraserPosition, setEraserPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // テキスト入力用の状態
  const [textInput, setTextInput] = useState<
    | { x: number; y: number; text: string }
    | null
  >(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // モードがnullの場合、デフォルトのフリーハンドとして扱う
  const actualMode = mode === null ? DRAWING_MODES.FREEHAND : mode;

  useEffect(() => {
    logger.debug(`[useDrawingCanvas] mode prop: ${mode}, actualMode: ${actualMode}`);
  }, [mode, actualMode]);

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        savedCanvasState.current = null;
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
        logger.debug(
          `Canvas resized: ${canvas.width}x${canvas.height}, Enabled: ${enabled}`,
        );
        // リサイズ時に保存された描画を再描画（オプション）
        if (savedCanvasState.current) {
          const ctx = canvas.getContext("2d");
          ctx?.putImageData(savedCanvasState.current, 0, 0);
        }
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      logger.debug("描画モードが有効になりました");
    } else {
      logger.debug("描画モードが無効になりました");
    }
  }, [enabled]);

  // モードが変更されたら消しゴム位置をリセット
  useEffect(() => {
    if (mode === ERASER) {
      // 初期位置をキャンバスの中央に設定
      const canvas = canvasRef.current;
      if (canvas) {
        const width = canvas.width / 2;
        const height = canvas.height / 2;
        setEraserPosition({ x: width, y: height });
      }
    } else {
      setEraserPosition(null);
    }
  }, [mode]);

  // テキスト入力が表示されたらフォーカスする
  useEffect(() => {
    if (textInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput]);

  const getContext = () => canvasRef.current?.getContext("2d");

  // プレビュー描画をクリアする関数（保存した状態に復元）
  const clearPreview = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx || !startPoint.current) return;

    if (savedCanvasState.current) {
      // 保存した状態を復元
      ctx.putImageData(savedCanvasState.current, 0, 0);
    } else {
      // 初回時のフォールバック
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // 消しゴム用の関数
  const erase = (x: number, y: number) => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !lastPoint.current) return;

    // 消しゴムサイズの半径
    const radius = eraserSize / 2;

    // globalCompositeOperationを使って消去
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.clearRect(x - radius, y - radius, eraserSize, eraserSize);
    ctx.restore();

    // 現在の状態を保存
    savedCanvasState.current = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );
  };

  // テキスト入力を確定してキャンバスに描画
  const handleTextSubmit = () => {
    if (!textInput) return;
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) {
      setTextInput(null);
      return;
    }
    ctx.fillStyle = color;
    ctx.font = `${14}px Arial`; // フォントサイズは固定、必要ならpropsで調整可能に
    ctx.fillText(textInput.text, textInput.x, textInput.y);
    savedCanvasState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setTextInput(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (textInput) {
      setTextInput({ ...textInput, text: e.target.value });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    logger.debug(`[handlePointerDown] 開始 - enabled: ${enabled}, mode: ${mode}, actualMode: ${actualMode}`);
    if (!enabled || mode === null) {
      logger.debug("[handlePointerDown] 描画不可 (enabled が false または mode が null)");
      return;
    }

    logger.debug("描画開始");
    const rect = e.currentTarget.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const canvas = canvasRef.current;
    const ctx = getContext();
    if (canvas && ctx) {
      savedCanvasState.current = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }

    if (actualMode === TEXT) {
      logger.debug(`テキストモードでクリックされました。位置: x=${point.x}, y=${point.y}`);
      // 直接クリック位置を使用
      setTextInput({ x: point.x, y: point.y, text: "" });
      logger.debug(`テキスト入力フィールドを表示: x=${point.x}, y=${point.y}`);
      return;
    }

    if (actualMode === FREEHAND || actualMode === ERASER) {
      drawing.current = true;
      lastPoint.current = point;

      // 消しゴムの場合、ポイントダウン時点で消去
      if (actualMode === ERASER) {
        erase(point.x, point.y);
      }
    } else {
      startPoint.current = point;
    }
  };

  // ここで描画ツールごとのプレビュー/描画ロジックは各フックに委譲する

  // ルーラーのプレビュー
  const drawRulerPreview = (endX: number, endY: number) => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !startPoint.current) return;

    clearPreview();

    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.moveTo(startPoint.current.x, startPoint.current.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    const diff = Math.abs(endY - startPoint.current.y);
    const percent = ((diff / canvas.height) * 100).toFixed(2);
    const text = `${diff.toFixed(2)}px (${percent}%)`;
    ctx.fillStyle = color;
    ctx.font = "12px Arial";
    ctx.fillText(
      text,
      (startPoint.current.x + endX) / 2 + 5,
      (startPoint.current.y + endY) / 2 - 5,
    );
  };

  // カーソルスタイルを決定
  const getCursorStyle = () => {
    if (!enabled) return "";

    // モードに基づいてカーソルスタイルを返す
    switch (mode) {
      case null:
        return "cursor-default"; // 選択モード
      case FREEHAND:
        return "cursor-pointer"; // フリーハンド (Tailwindにcursor-pencilがないため)
      case ERASER:
        return "cursor-not-allowed"; // 消しゴム
      case TEXT:
        return "cursor-text"; // テキストモード用のカーソル
      default:
        return "cursor-crosshair"; // その他の描画ツール
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled || mode === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 消しゴムモードの場合、常に位置を更新
    if (mode === ERASER) {
      logger.debug(
        `消しゴム位置更新: x=${x}, y=${y}, rect=${JSON.stringify({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        })}`,
      );
      setEraserPosition({ x, y });
    }

    if (actualMode === FREEHAND && drawing.current) {
      const ctx = getContext();
      if (!ctx || !lastPoint.current) return;
      drawFreehand(ctx, lastPoint.current, x, y, color, strokeWidth);
      lastPoint.current = { x, y };
    } else if (actualMode === ERASER && drawing.current) {
      // 消しゴム処理
      erase(x, y);
      lastPoint.current = { x, y };
    } else if (startPoint.current) {
      // 各モードのリアルタイムプレビュー
      const ctx = getContext();
      if (!ctx) return; // コンテキストがない場合は処理を終了
      
      if (actualMode === TRENDLINE) {
        clearPreview();
        previewTrendline(ctx, startPoint.current, x, y, color, strokeWidth);
      } else if (actualMode === FIBONACCI) {
        clearPreview();
        previewFibonacci(ctx, startPoint.current, x, y, color, strokeWidth);
      } else if (actualMode === HORIZONTAL_LINE) {
        clearPreview();
        previewHorizontalLine(ctx, canvasRef.current, y, color, strokeWidth);
      } else if (actualMode === BOX) {
        clearPreview();
        previewBox(ctx, startPoint.current, x, y, color, strokeWidth);
      } else if (actualMode === ARROW) {
        clearPreview();
        previewArrow(ctx, startPoint.current, x, y, color, strokeWidth);
      } else if (actualMode === RULER) {
        drawRulerPreview(x, y);
      }
    }
  };

  const endDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled || mode === null) return;

    logger.debug("描画終了");

    if (actualMode === TEXT) { // テキストモードでは何もしない
      // textInput があれば、ここで確定する代わりに blur イベントで処理される
      return;
    }

    if (actualMode === FREEHAND || actualMode === ERASER) {
      drawing.current = false;
      lastPoint.current = null;
      // 描画終了時に現在の状態を保存
      const canvas = canvasRef.current;
      const ctx = getContext();
      if (canvas && ctx) {
        savedCanvasState.current = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
      }
    } else if (startPoint.current) {
      const ctx = getContext();
      const canvas = canvasRef.current;
      if (!ctx || !canvas) {
        startPoint.current = null;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const end = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // プレビューをクリア（重要：最終描画前にクリアする）
      clearPreview();

      // 最終的な描画処理
      if (actualMode === TRENDLINE) {
        drawTrendline(ctx, startPoint.current, end.x, end.y, color, strokeWidth);
      } else if (actualMode === FIBONACCI) {
        drawFibonacci(ctx, startPoint.current, end.x, end.y, color, strokeWidth);
      } else if (actualMode === HORIZONTAL_LINE) {
        drawHorizontalLine(ctx, canvasRef.current, end.y, color, strokeWidth);
      } else if (actualMode === BOX) {
        drawBox(ctx, startPoint.current, end.x, end.y, color, strokeWidth);
      } else if (actualMode === ARROW) {
        drawArrow(ctx, startPoint.current, end.x, end.y, color, strokeWidth);
      } else if (actualMode === RULER) {
        drawRulerPreview(end.x, end.y);
      }

      // 描画後に状態を保存
      savedCanvasState.current = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );
      startPoint.current = null; // 描画終了時に始点をリセット
    }
  };

  // 消しゴムモードの場合、消しゴムのプレビューを表示するためのスタイル
  const getEraserCursorStyle = () => {
    if (mode === ERASER) {
      return {
        cursor: "none", // 標準カーソルを非表示
      };
    }
    return {};
  };

  // キャンバスのマウスエンター/リーブイベントハンドラ
  const handlePointerEnter = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode === ERASER) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      logger.debug(`ポインタ入場: x=${x}, y=${y}`);
      setEraserPosition({ x, y });
    }
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLCanvasElement>) => {
    endDrawing(e);
    if (mode === ERASER) {
      logger.debug("ポインタ退場: 消しゴム非表示");
      setEraserPosition(null);
    }
  };

  // グローバルマウス移動イベントを追加してキャンバス外でも動作するようにする
  useEffect(() => {
    if (mode === ERASER && canvasRef.current) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        // キャンバス上の相対位置を計算
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          logger.debug(`グローバルマウス移動: x=${x}, y=${y}`);
          setEraserPosition({ x, y });
        }
      };

      window.addEventListener("mousemove", handleGlobalMouseMove);
      return () => {
        window.removeEventListener("mousemove", handleGlobalMouseMove);
      };
    }
  }, [mode]);

  // 親コンテナのマウス移動イベントハンドラ
  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === ERASER) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        logger.debug(`コンテナマウス移動: x=${x}, y=${y}`);
        setEraserPosition({ x, y });
      }
    }
  };

  return {
    canvasRef,
    containerRef,
    eraserPosition,
    textInput,
    textInputRef,
    isDrawing: drawing.current,
    getCursorStyle,
    getEraserCursorStyle,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: endDrawing,
    handlePointerEnter,
    handlePointerLeave,
    handleContainerMouseMove,
    handleTextChange,
    handleTextSubmit,
  };
}
export default useDrawingCanvas;
