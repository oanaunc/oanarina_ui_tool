import fs from 'node:fs';
import ts from 'typescript';
const source=ts.createSourceFile('commands.ts',fs.readFileSync('src/commands.ts','utf8'),ts.ScriptTarget.Latest,true);
let found;
function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(source)==='commands'){let value=node.initializer;while(ts.isAsExpression(value)||ts.isSatisfiesExpression(value))value=value.expression;found=value.elements.map(row=>row.elements.map(value=>{if(!ts.isStringLiteralLike(value))throw Error('Command metadata must be literal strings.');return value.text;}));}ts.forEachChild(node,visit);}
visit(source);if(!found||new Set(found.map(c=>c[0])).size!==found.length)throw Error('Missing or duplicate command identifiers.');
fs.writeFileSync('public/commands.json',JSON.stringify(found,null,2)+'\n');
fs.copyFileSync('src/menu-order.json','public/menu-order.json');
console.log('Registered '+found.length+' commands');
