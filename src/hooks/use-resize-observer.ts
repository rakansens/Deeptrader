import { useEffect, useState } from "react";

export interface UseResizeObserverReturn {
  width: number;
  height: number;
}

/**
 * 指定した要素のサイズ変化を監視するフック
 * @param targetRef - 監視対象の要素のRef
 * @returns 要素の幅と高さ
 */
export default function useResizeObserver(
  targetRef: React.RefObject<HTMLElement>,
): UseResizeObserverReturn {
  const [size, setSize] = useState<UseResizeObserverReturn>({ width: 0, height: 0 });

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });

    update();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(update);
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [targetRef]);

  return size;
}
