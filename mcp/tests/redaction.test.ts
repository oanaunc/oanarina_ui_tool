import {test} from 'node:test';
import assert from 'node:assert/strict';
import {omitAssets} from '../server';
test('asset redaction covers stroke paints and library styles without mutating source',()=>{const image='data:image/png;base64,AAAA',source={fonts:[{data:'data:font/ttf;base64,AAAA'}],pages:[{nodes:[{image,strokes:[{paint:{image}}]}]}],styles:[{value:{paints:[{image}],strokes:[{paint:{image}}]}}]};const redacted=omitAssets(source);assert.ok(!JSON.stringify(redacted).includes('base64'));assert.ok(!('fonts' in redacted));assert.ok(JSON.stringify(source).includes('base64'));});

test('generic asset redaction does not exempt nested or unvalidated description keys',()=>{const image='data:image/png;base64,AAAA',font='data:font/ttf;base64,BBBB',source={description:image,pages:[{flows:[{description:image}]}],unknown:{description:font}};const redacted=omitAssets(source);assert.equal(redacted.description,'[embedded asset omitted]');assert.equal(redacted.pages[0].flows[0].description,'[embedded asset omitted]');assert.equal(redacted.unknown.description,'[embedded asset omitted]');assert.equal(source.description,image);});
