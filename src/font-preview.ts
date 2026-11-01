import {useMemo} from 'react';
import {create} from 'zustand';
import type {DesignNode} from './model';
import {updateTextMetrics} from './text-layout';
/** What the font picker is trying on the canvas. It never reaches the document, so closing the picker leaves no trace and no history. */
export const useFontPreview=create<{family:string;ids:string[]}>(()=>({family:'',ids:[]}));
export const previewFont=(family:string,ids:string[])=>useFontPreview.setState({family,ids});
export const clearFontPreview=()=>{if(useFontPreview.getState().family)useFontPreview.setState({family:'',ids:[]});};
export function previewFontNodes(nodes:DesignNode[],family:string,ids:readonly string[]){const set=new Set(ids),changed:DesignNode[]=[],next=nodes.map(n=>{if(!set.has(n.id)||n.type!=='text')return n;const copy={...n,fontFamily:family};changed.push(copy);return copy;});updateTextMetrics(changed);return next;}
export function useFontPreviewNodes(nodes:DesignNode[]){const {family,ids}=useFontPreview();return useMemo(()=>family?previewFontNodes(nodes,family,ids):nodes,[nodes,family,ids]);}
