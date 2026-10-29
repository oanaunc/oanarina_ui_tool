// Paper's published declarations name the extensionless subpath. Runtime ESM
// imports require .js; expose the same API types for that equivalent path.
declare module 'paper/dist/paper-core.js' {
 import paperCore = require('paper/dist/paper-core');
 export = paperCore;
}
