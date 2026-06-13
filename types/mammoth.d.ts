declare module 'mammoth' {
  interface ExtractRawTextResult {
    value: string;
    messages: any[];
  }
  interface ConvertOptions {
    buffer?: Buffer;
    path?: string;
  }
  function extractRawText(options: ConvertOptions): Promise<ExtractRawTextResult>;
  export { extractRawText, ExtractRawTextResult, ConvertOptions };
}
