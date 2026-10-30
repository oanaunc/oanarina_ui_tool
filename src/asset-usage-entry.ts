import {useEditor} from './store';
import type {DesignDocument} from './model';
let request:{document:DesignDocument;key?:string}|undefined;
export function openAssetUsage(key?:string){const state=useEditor.getState();request={document:state.doc,key};state.set({modal:'asset-usage'});}
export function requestedAsset(doc:DesignDocument){return request?.document===doc?request.key:undefined;}
