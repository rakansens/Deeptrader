declare module 'html2canvas' {
  interface Html2CanvasOptions {
    allowTaint?: boolean;
    useCORS?: boolean;
    scale?: number;
    logging?: boolean;
    foreignObjectRendering?: boolean;
    onclone?: (document: Document) => Document;
    [key: string]: any;
  }
  
  const html2canvas: (
    element: HTMLElement,
    options?: Html2CanvasOptions
  ) => Promise<HTMLCanvasElement>;
  
  export default html2canvas;
}
