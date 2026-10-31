import type {DesignDocument} from './model';
import {updateDocumentWidgets,validateDocumentWidgets} from './local-widget-document';
import {updateDocumentLinkCards,validateDocumentLinkCards} from './whiteboard-link-cards';
import {updateDocumentPolls,validateDocumentPolls} from './slide-polls';
import {updateDocumentPrototypeEmbeds,validateDocumentPrototypeEmbeds} from './slide-prototype-embed';
/** Frames that own generated child layers. Each is optional node data, so legacy files stay unchanged and duplicate/paste/page moves carry records with their layers. */
export function updateDocumentEmbeds(d:DesignDocument){updateDocumentWidgets(d);updateDocumentLinkCards(d);updateDocumentPolls(d);updateDocumentPrototypeEmbeds(d);}
export function validateDocumentEmbeds(d:{pages?:unknown}){validateDocumentWidgets(d);validateDocumentLinkCards(d);validateDocumentPolls(d);validateDocumentPrototypeEmbeds(d);}
