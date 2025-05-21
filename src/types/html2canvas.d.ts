declare module 'html2canvas' {
  interface Html2CanvasOptions {
    allowTaint?: boolean;
    useCORS?: boolean;
    scale?: number;
    logging?: boolean;
    foreignObjectRendering?: boolean;
    onclone?: (document: Document) => Document;
    // 任意の追加オプションを受け取る
    [key: string]: unknown;
  }
  
  const html2canvas: (
    element: HTMLElement,
    options?: Html2CanvasOptions
  ) => Promise<HTMLCanvasElement>;
  
  export default html2canvas;
}
