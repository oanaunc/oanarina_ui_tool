import path from 'node:path';
import fs from 'node:fs';
import ts from 'typescript';
/** What the importer reads, found by the type checker rather than by a list someone has to remember to update.
 * A property of a value typed as a decoded record is a field name. A string compared with that property, or a key
 * of a table looked up by it, is an enum value. */
export interface FieldRead {name:string;file:string;}
export interface EnumRead {field:string;value:string;file:string;}
export interface FieldScan {fields:FieldRead[];values:EnumRead[];unresolved:string[];}
const root=path.resolve(import.meta.dirname,'../..');
/** The readers of decoded records. Container, schema and limit modules read bytes, not records. fig-document reads layers of unknown shape on purpose, by what they hold rather than by schema name. */
export const importerFiles=()=>fs.readdirSync(path.join(root,'src')).filter(f=>/^fig-.*\.ts$/.test(f)&&!/worker|fig-kiwi|fig-container|fig-limits|fig-import|fig-settle|fig-document/.test(f)).map(f=>path.join(root,'src',f));
const unwrapCalls=new Set(['string','number','flag','optional','object','list','bytes','guid','reference','color','matrix']);
export function scanImporterFields(files=importerFiles(),virtual:Record<string,string>={}):FieldScan{
 const options:ts.CompilerOptions={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX,strict:true,noEmit:true,skipLibCheck:true,types:[],lib:['lib.es2023.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts']},host=ts.createCompilerHost(options),readFile=host.readFile.bind(host),exists=host.fileExists.bind(host),source=host.getSourceFile.bind(host);
 host.readFile=f=>virtual[f]??readFile(f);host.fileExists=f=>f in virtual||exists(f);host.getSourceFile=(f,v,...rest)=>f in virtual?ts.createSourceFile(f,virtual[f],v,true):source(f,v,...rest);
 const program=ts.createProgram([...files,...Object.keys(virtual)],options,host),checker=program.getTypeChecker(),fields:FieldRead[]=[],values:EnumRead[]=[],unresolved:string[]=[];
 const isRecord=(type:ts.Type):boolean=>{if(type.isUnion())return type.types.some(isRecord);const index=type.getStringIndexType();return !!index&&!!(index.flags&ts.TypeFlags.Unknown);};
 /** The field an expression came from, through the bounded readers and through one level of a local constant. */
 const origin=(e:ts.Expression,depth=0):string|undefined=>{if(depth>6)return;if(ts.isParenthesizedExpression(e)||ts.isAsExpression(e)||ts.isNonNullExpression(e))return origin(e.expression,depth+1);if(ts.isPropertyAccessExpression(e))return isRecord(checker.getTypeAtLocation(e.expression))?e.name.text:undefined;if(ts.isElementAccessExpression(e)&&ts.isStringLiteralLike(e.argumentExpression))return isRecord(checker.getTypeAtLocation(e.expression))?e.argumentExpression.text:undefined;if(ts.isCallExpression(e)&&ts.isIdentifier(e.expression)&&unwrapCalls.has(e.expression.text)&&e.arguments[0])return origin(e.arguments[0],depth+1);if(ts.isBinaryExpression(e)&&e.operatorToken.kind===ts.SyntaxKind.QuestionQuestionToken)return origin(e.left,depth+1);if(ts.isIdentifier(e)){const declaration=checker.getSymbolAtLocation(e)?.valueDeclaration;if(declaration&&ts.isVariableDeclaration(declaration)&&declaration.initializer)return origin(declaration.initializer,depth+1);}return;};
 const literals=(e:ts.Expression):string[]=>{if(ts.isStringLiteralLike(e))return [e.text];if(ts.isParenthesizedExpression(e)||ts.isAsExpression(e))return literals(e.expression);return [];};
 /** An object or array of names, directly or through a constant. */
 const table=(e:ts.Expression,depth=0):ts.Expression|undefined=>{if(depth>3)return;if(ts.isParenthesizedExpression(e)||ts.isAsExpression(e)||ts.isNonNullExpression(e))return table(e.expression,depth+1);if(ts.isObjectLiteralExpression(e)||ts.isArrayLiteralExpression(e))return e;if(ts.isIdentifier(e)){const declaration=checker.getSymbolAtLocation(e)?.valueDeclaration;if(declaration&&ts.isVariableDeclaration(declaration)&&declaration.initializer)return table(declaration.initializer,depth+1);}return;};
 const names=(e:ts.Expression):string[]=>{const t=table(e);if(!t)return [];if(ts.isArrayLiteralExpression(t))return t.elements.flatMap(v=>ts.isStringLiteralLike(v)?[v.text]:ts.isSpreadElement(v)?names(v.expression):[]);return (t as ts.ObjectLiteralExpression).properties.flatMap(p=>p.name&&(ts.isIdentifier(p.name)||ts.isStringLiteralLike(p.name))?[p.name.text]:[]);};
 for(const file of [...files,...Object.keys(virtual)]){const sf=program.getSourceFile(file)!,label=path.basename(file);
  const visit=(n:ts.Node)=>{
   if(ts.isPropertyAccessExpression(n)&&isRecord(checker.getTypeAtLocation(n.expression)))fields.push({name:n.name.text,file:label});
   if(ts.isElementAccessExpression(n)&&!ts.isParenthesizedExpression(n.expression)&&isRecord(checker.getTypeAtLocation(n.expression))){const key=n.argumentExpression;if(ts.isStringLiteralLike(key))fields.push({name:key.text,file:label});else{const type=checker.getTypeAtLocation(key),parts=type.isUnion()?type.types:[type];if(parts.every(t=>t.isStringLiteral()))for(const t of parts)fields.push({name:(t as ts.StringLiteralType).value,file:label});else unresolved.push(label+': '+n.getText(sf).slice(0,60));}}
   if(ts.isBinaryExpression(n)&&[ts.SyntaxKind.EqualsEqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(n.operatorToken.kind)){for(const [a,b] of [[n.left,n.right],[n.right,n.left]] as const){const field=origin(a);if(field)for(const value of literals(b))values.push({field,value,file:label});}}
   // A table looked up by a decoded value: every key has to be a value the format can hold.
   if(ts.isElementAccessExpression(n)&&table(n.expression)){const field=origin(n.argumentExpression);if(field)for(const value of names(n.expression))values.push({field,value,file:label});}
   if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='includes'&&n.arguments[0]&&table(n.expression.expression)){const field=origin(n.arguments[0]);if(field)for(const value of names(n.expression.expression))values.push({field,value,file:label});}
   // string(raw.field,'DEFAULT') states a value too.
   if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text==='string'&&n.arguments.length===2&&ts.isStringLiteralLike(n.arguments[1])&&n.arguments[1].text){const field=origin(n.arguments[0]);if(field)values.push({field,value:n.arguments[1].text,file:label});}
   ts.forEachChild(n,visit);};
  visit(sf);}
 return {fields,values,unresolved};
}
export interface SchemaNames {fields:Set<string>;enums:Map<string,Set<string>>;}
const primitives=new Set([-1,-2,-3,-4,-5,-6,-7,-8]);
/** Every field name, and for each field holding an enum the values of that enum, in a decoded embedded schema. */
export function schemaNames(definitions:{name:string;kind:number;fields:{name:string;type:number}[]}[]):SchemaNames{
 const fields=new Set<string>(),enums=new Map<string,Set<string>>();
 for(const d of definitions){if(d.kind===0)continue;for(const f of d.fields){fields.add(f.name);if(primitives.has(f.type))continue;const target=definitions[f.type];if(target?.kind===0){const set=enums.get(f.name)??new Set<string>();for(const v of target.fields)set.add(v.name);enums.set(f.name,set);}}}
 return {fields,enums};
}
