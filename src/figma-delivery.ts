import type {DesignDocument} from './model';
import {annotationsWithoutPrivateMetadata} from './layer-annotations';
/** Explicit editable delivery excludes private review metadata; normal .oui saves retain it. */
export function prepareFigmaDelivery(document:DesignDocument){const copy=annotationsWithoutPrivateMetadata(document,true);for(const page of copy.pages)page.comments=[];return copy;}
