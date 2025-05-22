import { renderHook, act } from '@testing-library/react'
import React from 'react'
import useDrawingCanvas, {
  type UseDrawingCanvasProps
} from '@/hooks/use-drawing-canvas'
import { type DrawingCanvasHandle } from '@/types/chart'

const mockCtx = {
  fillText: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(0) } as ImageData)),
  // clearRect, putImageData など、他のCanvasRenderingContext2Dメソッドも必要に応じてモック化
  clearRect: jest.fn(),
  putImageData: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn(),
  clip: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  // strokeRect, fill, etc.
  strokeRect: jest.fn(),
  fill: jest.fn(),

}

describe('useDrawingCanvas text mode', () => {
  beforeEach(() => {
    // 各テストの前にモック関数をリセット
    jest.clearAllMocks();
  });

  it('draws text on submit', () => {
    const ref = React.createRef<DrawingCanvasHandle>()
    const { result } = renderHook((props: UseDrawingCanvasProps) => useDrawingCanvas(props, ref), {
      initialProps: { mode: 'text', enabled: true, color: '#000000' }, // color も渡す
    })

    const canvas = document.createElement('canvas')
    Object.defineProperty(canvas, 'width', { value: 100, writable: true })
    Object.defineProperty(canvas, 'height', { value: 100, writable: true })
    // getContext が常に同じモックインスタンスを返すようにする
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D)

    act(() => {
      // canvasRef にモックcanvasを割り当て
      (result.current.canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvas
      // pointer down でテキスト入力開始
      result.current.pointerHandlers.onPointerDown({
        currentTarget: canvas,
        clientX: 10,
        clientY: 20,
      } as unknown as React.PointerEvent<HTMLCanvasElement>)
    })

    // textInput state が更新されていることを確認 (オプション)
    expect(result.current.textInput).toEqual({ x: 10, y: 20, text: '' });

    act(() => {
      // テキスト入力
      result.current.handleTextChange({
        target: { value: 'Hello' }
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    })

    // textInput state が更新されていることを確認
    expect(result.current.textInput).toEqual({ x: 10, y: 20, text: 'Hello' });

    act(() => {
      // テキスト描画確定
      result.current.handleTextSubmit()
    })

    // fillText が正しい引数で呼び出されたか確認
    expect(mockCtx.fillText).toHaveBeenCalledWith('Hello', 10, 20)
    // getImageData が呼び出されたか確認 (保存処理)
    expect(mockCtx.getImageData).toHaveBeenCalledWith(0, 0, 100, 100);
    // textInput が null にリセットされたか確認
    expect(result.current.textInput).toBeNull()
  })

  it('should focus input when textInput is active', () => {
    const ref = React.createRef<DrawingCanvasHandle>();
    const { result, rerender } = renderHook((props: UseDrawingCanvasProps) => useDrawingCanvas(props, ref), {
      initialProps: { mode: 'text', enabled: true },
    });

    const canvas = document.createElement('canvas');
    (result.current.canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvas;
    
    const mockInputRef = { focus: jest.fn() } as unknown as HTMLInputElement;
    (result.current.textInputRef as React.MutableRefObject<HTMLInputElement | null>).current = mockInputRef;

    // 初期状態では textInput は null
    expect(result.current.textInput).toBeNull();

    // テキスト入力モードを開始
    act(() => {
      result.current.pointerHandlers.onPointerDown({
        currentTarget: canvas,
        clientX: 50,
        clientY: 50,
      } as unknown as React.PointerEvent<HTMLCanvasElement>);
    });
    
    // textInput が設定された後、rerender をシミュレートして useEffect をトリガー
    // （実際にはuseStateの更新で自動的にrerenderされるが、テスト環境では明示的に行うことも）
    rerender({ mode: 'text', enabled: true });

    // focus が呼ばれたことを確認
    expect(mockInputRef.focus).toHaveBeenCalled();
  });
}); 