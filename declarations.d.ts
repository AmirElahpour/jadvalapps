declare module '*.ttf' {
  const asset: number;
  export default asset;
}

declare module 'html2canvas' {
  export default function html2canvas(element: HTMLElement, options?: any): Promise<HTMLCanvasElement>;
}

