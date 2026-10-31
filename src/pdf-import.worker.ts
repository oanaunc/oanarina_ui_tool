// This dedicated parser worker never receives a URL and never opens remote resources.
// PDF JavaScript/annotation/attachment APIs and the PDF.js viewer are not used.
import 'pdfjs-dist/legacy/build/pdf.worker.mjs';
const scope=self as unknown as {fetch:typeof fetch;XMLHttpRequest:unknown};
scope.fetch=async()=>{throw new Error('Offline PDF worker resource requests are disabled.');};
scope.XMLHttpRequest=class {constructor(){throw new Error('Offline PDF worker resource requests are disabled.');}};
