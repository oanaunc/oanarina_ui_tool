import type {DesignDocument} from './model';
import {annotationsWithoutPrivateMetadata} from './layer-annotations';
/** Explicit editable delivery excludes private review metadata; normal .oui saves retain it. */
export function prepareFigmaDelivery(document:DesignDocument){const copy=annotationsWithoutPrivateMetadata(document,true);for(const page of copy.pages){page.comments=[];for(const n of page.nodes)if(n.code)n.code={...n.code,html:'',css:'',js:''};for(const n of page.nodes)delete n.prototypeAudio;}return copy;}
