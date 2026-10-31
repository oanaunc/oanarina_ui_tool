# Prototype comments

Press **C** in a running presentation, or use **Comments** in its footer. The prototype pauses, a panel opens beside the frame, and clicks place a comment. Press C again, or Escape, to resume; a delayed advance restarts from zero when comment mode closes.

## What a prototype comment is

An ordinary file-local thread with one extra optional field, `surface: 'prototype'`, and an `anchor` in the frame's own axes. Because it is a normal thread it also appears as a canvas pin, in **View → Comments** (filter **Left in a prototype**), in comment links, and in page duplication with its anchor remapped. Moving or resizing the frame moves the pin. Deleting the frame keeps the thread at its saved page position and removes it from the presentation.

The presentation also shows threads left in Design when they are anchored to the frame or to a layer inside it. Fixed-position page comments have no frame and appear only in Design.

## Paths

- Place: click inside the top frame or open overlay. A click elsewhere is refused with a message.
- Scrolling frames store the point in frame content, so the pin moves with the content and leaves the view when scrolled away. The thread stays in the panel.
- Threads: read, reply, resolve, reopen, delete. Editing message text and reactions stay in **View → Comments**.
- Undo: each write is one ordinary history step. In comment mode the panel buttons and Command-Z / Shift-Command-Z walk the writes made in this comment session; after closing, the ordinary Undo stack covers them.
- Keyboard: pins are buttons; Enter moves focus to the thread.

Comment mode blocks hover, press, click, drag, key, delay and gamepad reactions. The frame selector, arrow keys and toolbar Back still navigate. A key reaction bound to C wins over the comment shortcut on frames that define one.

## Document identity

Running presentations refuse a replaced document: a linked flow, a form preview and Motion preview all close, because an artwork edit invalidates them. A comment write also replaces the document object. `commentOnlyEdit` runs the ordinary `edit` path and joins the old and new objects as one artwork source before publication, so those guards can tell the difference. Membership is granted nowhere else, and any other edit breaks the join. Undo and Redo return to joined objects, so they stay safe in a presentation. Prototype audio stops on a comment write, because its player requires the exact source document.

## Limits

- Motion preview has no comment path: it renders a sampled scene, not a frame coordinate space.
- Inspect presentations show threads read-only. Slides have their own presentation with no comment path.
- Comments anchor to frames, never to a nested scroll offset or variant state. Variant and variable changes in the running prototype do not move pins.
- Exported prototype files carry no comments. Comments live only in the `.oui`.
- The panel lists up to 200 threads per frame and 20 replies per thread; the rest stay in View → Comments.
- A protected main branch refuses the write in the panel and keeps the draft.

## File compatibility

`surface` is optional and appears only on comments created this way. It is validated with the other comment fields: any other value, or `surface` without an anchor, refuses the file before it opens. Older Forma builds open these files and treat the thread as an ordinary anchored comment.

## Checks

`tests/prototype-comments.test.ts` covers mapping, anchoring, refusal, validation, listing bounds, Undo identity, the linked-flow guard and write permissions. `tests/e2e/prototype-comments.spec.ts` covers placement, Save and Open, scrolling pins, thread actions, in-presentation Undo, refusal, form values surviving a write, Inspect read-only, a delayed advance held and resumed, branch protection refusal, and keyboard reach.
