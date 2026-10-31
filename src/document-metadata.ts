import {validateDocumentPassThrough} from './pass-through';
import {validateDocumentPrototypeAudio} from './prototype-audio';
import {validateDocumentNetworks} from './vector-network';
import {validateDocumentPrototypeInputs} from './prototype-input';
import {validateDocumentBackgroundBlur} from './background-blur';
import {validateDocumentComponentSlots} from './component-slots';
import {validateDocumentTextPaths} from './text-path';
import {validateDocumentCalligraphicStrokes} from './calligraphic-stroke';
import {validateDocumentDynamicStrokes} from './dynamic-stroke';
import {validateDocumentLiveRepeats} from './live-repeat';
import {validateDocumentCommentThreads} from './comment-threads';
import {validateDocumentDeveloperResources} from './developer-resources';
import {validateDocumentAnnotations} from './layer-annotations';
import {validateDocumentStrokeScaling} from './stroke-scaling';
import {validateDocumentDevelopmentStatuses} from './development-status';
import {validateLibraryMetadata} from './local-library-metadata';
import {validateDocumentCover} from './document-cover';
import {validateDocumentProgressiveBlur} from './progressive-blur';
import {validateDocumentCornerSmoothing} from './corner-smoothing';
import {validateDocumentVariableWidths} from './variable-width';
import {validateDocumentRotationOrigins} from './rotation-origin';
import {validateDocumentSurfaces} from './surface-paint';
import {validateDocumentLayoutSettings} from './layout-settings';
import {validateDocumentEdgeStrokes} from './edge-strokes';
import {validateDocumentLinearGradients} from './linear-gradient';
import {validateComponentWorkflowMetadata} from './component-workflow-metadata';
import {validateDocumentMedia} from './media';
import {validateDocumentEmbeds} from './document-embeds';
import {validateSectionMetadata} from './section-metadata';
import {validateDocumentImageAdjustments} from './image-paint';
import {validateDocumentArrowheads} from './arrowheads';
import {validateDocumentExportSettings} from './frame-export-settings';
/** Optional .oui document metadata. Bounds apply equally to files and local UI. */
export const DOCUMENT_DESCRIPTION_LIMIT=10_000;
const forbiddenControls=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/;
export function validateDocumentMetadata(document:{workspace?:unknown;fileCover?:unknown;description?:unknown;pages?:unknown;componentSets?:unknown;styles?:unknown;libraryPublication?:unknown;componentLibraries?:unknown}){
 validateDocumentPassThrough(document);
 validateDocumentNetworks(document);
 validateDocumentPrototypeInputs(document);
 validateDocumentComponentSlots(document);
 validateDocumentCommentThreads(document);
 validateLibraryMetadata(document);
 validateDocumentAnnotations(document);
 validateDocumentStrokeScaling(document);
 validateDocumentDevelopmentStatuses(document);
 validateDocumentCover(document);
 validateDocumentDeveloperResources(document);
 const value=document.description;
 if(value!==undefined&&(typeof value!=='string'||value.length>DOCUMENT_DESCRIPTION_LIMIT||forbiddenControls.test(value)))throw Error('File description must be plain text up to 10,000 characters, without disallowed control characters.');
 validateDocumentCornerSmoothing(document);
 validateDocumentVariableWidths(document);
 validateDocumentDynamicStrokes(document);
 validateDocumentLiveRepeats(document);
 validateDocumentTextPaths(document);
 validateDocumentCalligraphicStrokes(document);
 validateDocumentRotationOrigins(document);
 validateDocumentBackgroundBlur(document);
 validateDocumentProgressiveBlur(document);
 validateDocumentSurfaces(document);
 validateDocumentLayoutSettings(document);
 validateDocumentEdgeStrokes(document);
 validateDocumentExportSettings(document);
 validateSectionMetadata(document);
 validateDocumentImageAdjustments(document);
 validateDocumentLinearGradients(document);
 validateDocumentArrowheads(document);
 validateComponentWorkflowMetadata(document);
 validateDocumentMedia(document);
 validateDocumentEmbeds(document);
 validateDocumentPrototypeAudio(document);
}
/** Plain text is preserved literally; only line endings and empty clearing normalize. */
export function normalizedDocumentDescription(value:string):string|undefined{
 validateDocumentMetadata({description:value});const normalized=value.replace(/\r\n?/g,'\n');return normalized.trim()?normalized:undefined;
}
export interface DescriptionSnapshot {id:string;description?:string;}
/** Call on an editor draft. Validation/conflict checks happen before mutation. */
export function applyDocumentDescription(document:DescriptionSnapshot,value:string,expected?:DescriptionSnapshot){
 const next=normalizedDocumentDescription(value);
 if(expected&&(document.id!==expected.id||document.description!==expected.description))throw Error('This file or its description changed. Reopen File information before saving.');
 if(document.description===next)return false;
 if(next===undefined)delete document.description;else document.description=next;
 return true;
}
