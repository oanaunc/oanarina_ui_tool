import {createContext,useSyncExternalStore} from 'react';
import type {DocumentColorProfile} from '../color-profile';
import type {ShaderDefinition} from '../shaders';
import {useEditor} from '../store';
/** Per-Artwork output settings. rasterScale marks a deliverable: export resolution and budget, no live pointer. */
export interface ArtworkOutput {profile?:DocumentColorProfile;shaders?:ShaderDefinition[];rasterScale?:number;}
export const ArtworkOutputContext=createContext<ArtworkOutput>({});
const profileOf=()=>useEditor.getState().doc.colorProfile,shadersOf=()=>useEditor.getState().doc.shaders;
/** The server snapshot must read live state: renderToStaticMarkup is how SVG, raster and PDF export render. */
export const useDocumentOutput=()=>({profile:useSyncExternalStore(useEditor.subscribe,profileOf,profileOf),shaders:useSyncExternalStore(useEditor.subscribe,shadersOf,shadersOf)});
