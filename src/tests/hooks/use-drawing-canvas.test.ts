import { renderHook, act } from '@testing-library/react'
import useDrawingCanvas from '@/hooks/use-drawing-canvas'
import React from 'react'

describe('useDrawingCanvas', () => {
  it('updates eraser position on pointer enter and resets on mode change', () => {
    const ref = React.createRef<any>()
    const { result, rerender } = renderHook(
      (props: any) => useDrawingCanvas(props, ref),
      { initialProps: { mode: 'eraser', enabled: true } }
    )

    const canvas = document.createElement('canvas')
    Object.defineProperty(canvas, 'width', { value: 100, writable: true })
    Object.defineProperty(canvas, 'height', { value: 100, writable: true })
    act(() => {
      (result.current.canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvas
      result.current.handlePointerEnter({
        currentTarget: canvas,
        clientX: 10,
        clientY: 20,
      } as any)
    })

    expect(result.current.eraserPosition).toEqual({ x: 10, y: 20 })

    act(() => {
      rerender({ mode: 'freehand', enabled: true })
    })
    expect(result.current.eraserPosition).toBeNull()
  })
})
