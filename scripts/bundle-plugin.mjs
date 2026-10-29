import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
fs.rmSync('public/figma-bridge.zip',{force:true});
execFileSync('zip',['-q','-r','public/figma-bridge.zip','figma-plugin']);
