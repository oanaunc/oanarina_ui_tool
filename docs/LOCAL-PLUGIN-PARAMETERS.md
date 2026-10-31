# Typed values for a local command run

Assets → Local plugins supports optional typed input declarations in a Forma version-one command package. Forma displays their names, types, defaults and bounds during package review, then renders ordinary trusted controls in **Values for this run**. Package JavaScript supplies no HTML, input event handlers or remote data. This is an independent bounded parameter API, not Figma Plugin API compatibility or arbitrary guest UI.

`parameters` is an optional array with at most 12 unique definitions. Existing packages that omit it keep their original format and behavior. Each field has a `key` (lowercase ASCII first letter, then letters/digits/underscore, at most 40 characters), a nonempty `label` (80 characters), optional `description` (240 characters), a type and a required default. Unsafe object keys, unknown fields, control characters, malformed defaults and oversized definitions refuse during inert package import. Definitions total at most 20 KB UTF-8 within the existing 200 KB package limit.

```json
[
  {"key":"caption","label":"Caption","type":"text","default":"Hello","maxLength":80},
  {"key":"width","label":"Width","type":"number","default":120,"min":1,"max":400},
  {"key":"enabled","label":"Enabled","type":"boolean","default":true},
  {"key":"color","label":"Color","type":"choice","default":"Blue","options":["Blue","Red"]}
]
```

Two additions make a form follow the file. `{"type":"source","source":"layers","default":""}` lists this file's `pages`, current-page `layers`, `components`, `styles` or `variables` in a trusted menu, up to 500 rows. Names stay in the form, and the run receives only the chosen ID, or an empty string for None. `"showWhen":{"key":"color","equals":"Red"}` on any field shows it only while an earlier field has that value. A hidden field keeps its value and still reaches the run. Package code never builds the form.

Text fields are single-line, with limits of 1–1,000 UTF-16 units; defaults and submitted values containing CR/LF refuse. Numbers have explicit finite ordered bounds within ±1,000,000. Choice fields offer 1–20 unique nonempty values of up to 80 characters and a default that actually appears in the list. Choices require trimmed single-space text without tabs or CR/LF so native option display cannot conceal distinct choices; explicit option values preserve their exact identities. Checkboxes carry real booleans. Empty numeric fields refuse Run; out-of-range values are rejected again before sandbox allocation. Unknown or missing submitted keys refuse rather than silently falling back. When no submitted values are supplied by a source caller, declared defaults are used.

Within an explicit run:

```js
const values = await forma.readParameters();
await forma.propose({operations: [{
  op: 'create', key: 'caption', type: 'text',
  properties: {text: values.caption, width: values.width, height: 40}
}]});
```

Every read returns an independent scalar snapshot. Guest mutation of a returned object cannot change later reads or the reviewed proposal. This API exposes only the values explicitly supplied to the package; document reads and writes retain their existing separate permission checks. Reads share the existing message count, payload and run deadline limits. The guardian remains opaque and hash-pinned with its restrictive CSP; no networking, storage, DOM or native access is added.

Changing any value or using **Reset plugin parameter values** cancels the earlier run/proposal. Local choices and source/package/permission receipts reject retained controls even after an away/back cycle. Fresh controls can run again. Package selection/replacement and closing/reopening the manager discard entered values and leave fresh permission checkboxes unchecked. Values are held only by the open manager and that run; they are not added as metadata to projects, recovery, exports or installed catalog entries. A package can intentionally use a value in its proposed artwork or local console, which remains visible for review. Manifest defaults are package data and remain part of its locally installed package.

Resulting ordinary edits still require separate reviewed Apply and use the existing atomic validation, Undo and save paths. Dynamic dependent forms, guest-rendered controls, file/secret controls, saved presets, arbitrary parameter schemas, remote options and Figma-specific parameter compatibility remain unsupported. Native WKWebView and real Figma reference acceptance remain pending while app/release builds stay paused.
