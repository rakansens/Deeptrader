import { useState, useRef, useEffect } from 'react';

export interface TextInputState {
  x: number;
  y: number;
  text: string;
}

export interface UseTextInputOptions {
  color: string;
}

export function useTextInput({ color }: UseTextInputOptions) {
  const [textInput, setTextInput] = useState<TextInputState | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput]);

  const start = (x: number, y: number) => {
    setTextInput({ x, y, text: '' });
  };

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (textInput) {
      setTextInput({ ...textInput, text: e.target.value });
    }
  };

  const commit = (
    ctx: CanvasRenderingContext2D | null,
    canvas: HTMLCanvasElement | null,
  ) => {
    if (!textInput) return;
    if (!ctx || !canvas) {
      setTextInput(null);
      return;
    }
    ctx.fillStyle = color;
    ctx.font = `${14}px Arial`;
    ctx.fillText(textInput.text, textInput.x, textInput.y);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setTextInput(null);
    return data;
  };

  return { textInput, textInputRef, start, change, commit };
}

export default useTextInput;
