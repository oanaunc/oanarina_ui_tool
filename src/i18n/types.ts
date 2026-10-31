export type MessageValues=Readonly<Record<string,string|number>>;
/** CLDR plural categories; `other` is required because every language has it. */
export interface PluralForms{one?:string;two?:string;few?:string;many?:string;zero?:string;other:string}
export type Catalog=Readonly<Partial<Record<string,string|PluralForms>>>;
export interface LanguagePack{name:string;status:'source'|'partial'|'preview';direction:'ltr'|'rtl';messages:Catalog}
