import type {WorkspacePreferences} from './workspace-preferences';
/** Prefixes the layer name before the shared filename sanitizer; suffixes and collision handling stay downstream. */
export function exportStem(pattern:WorkspacePreferences['exportNaming'],layer:string,context:{document:string;page:string}){if(pattern==='document-layer')return context.document+' - '+layer;if(pattern==='page-layer')return context.page+' - '+layer;if(pattern!=='layer')throw Error('Invalid export naming pattern.');return layer;}
