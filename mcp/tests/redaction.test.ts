import {test} from 'node:test';
import assert from 'node:assert/strict';
import {omitAssets} from '../server';
test('asset redaction covers stroke paints and library styles without mutating source',()=>{const image='data:image/png;base64,AAAA',source={fonts:[{data:'data:font/ttf;base64,AAAA'}],pages:[{nodes:[{image,strokes:[{paint:{image}}]}]}],styles:[{value:{paints:[{image}],strokes:[{paint:{image}}]}}]};const redacted=omitAssets(source);assert.ok(!JSON.stringify(redacted).includes('base64'));assert.ok(!('fonts' in redacted));assert.ok(JSON.stringify(source).includes('base64'));});
