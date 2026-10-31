# Code Connect and code generators

Both live in Inspect. They are Forma-specific local features: they do not use the Figma Code Connect CLI, its file formats or Figma's servers, and no reference verification has been done.

## Mapping a component

Select an instance, a main component or a layer inside one, then open **Code Connect**. **Add code mapping** asks for a language, a code component name, an optional source path or package name, and a code prop for each design property. Set members can be mapped for all variants or just one; a variant-specific mapping wins for that language. Each component takes one mapping per language.

Variant axes accept a value map, written as `Large=lg, Small=sm`. Boolean, text and instance-swap component properties map by name. `children` sends a property to the element's content.

Mappings save in the file as an optional `codeConnect` array. Each save or removal is one Undo step. Input is validated on edit and on import, so URLs, schemes, unknown languages, invalid identifiers, duplicate targets, unsafe keys and oversized fields all refuse before anything changes. Legacy files carry no field. A document holds up to 2,000 mappings.

A deleted component leaves a visible orphan rather than an invalid file. **Remove orphaned mappings** clears them.

## Snippets

The panel generates a snippet from the mapping and the selected instance's own values, including its variant, property values and mapped enum values. Languages are TSX, JSX, Vue, Svelte, HTML, SwiftUI-style Swift and Compose-style Kotlin. A swapped instance nests its own mapping in the same language, or falls back to its name with a note.

**Snippet template** replaces the generated form. `{{codeProp}}` inserts a mapped value and `{{component}}` the component name. A placeholder with no mapping stays visible and raises a warning. Snippets are plain text, are never executed, and copy through the system clipboard.

## Limits

- Mappings are written by hand. Forma does not read a repository, parse components, suggest mappings, check that a source path exists or sync anything.
- Mappings stay in this file. Copying a component to another file, publishing a library or using the Figma Bridge does not carry them, and component copies inside a file are new components with no mapping.
- Generated syntax is a starting point for review, not compiler-checked output.

## Code generators

Inspect's **Code generator** list starts with Forma's approximate CSS. Local plugins that declare `codegen:run` and `codegen.languages` add entries. The choice is remembered per device, outside the file. Choosing one does not run it: **Generate code** starts one fresh sandbox for the current layer.

That run has only `forma.codegen.input()`, `forma.codegen.result({sections:[{title,language,code}]})` and `forma.log`. `input()` returns the chosen language and the layer's type, name, geometry, opacity, radius, solid fill, layout values and, for text, its text and typography. It excludes comments, annotations, embedded images, code layer source and every other layer. Reads, storage, network and the interface all refuse, whatever else the package declares. A result holds up to 8 sections of 200,000 characters and renders as plain text. Changing the selection or document cancels the run.

Regeneration on selection is opt-in. **Generate on each selection** is off by default and remembered per device with the generator, because each generate executes third-party code. Each run is still one fresh sandbox holding only that layer, and changing the selection cancels a run in progress.

## Validation

`tests/code-connect.test.ts` covers schema refusal, instance and set resolution, language output, templates, nested swaps, orphans, Undo, codegen manifests, result bounds and input redaction. `tests/e2e/code-connect.spec.ts` drives the Inspect panel, clipboard, refused input, edit and orphan flows, a real sandboxed generator with every other capability refused, device persistence, failure reporting and cancellation on selection change.
