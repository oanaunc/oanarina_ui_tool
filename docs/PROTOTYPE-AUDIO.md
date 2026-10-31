# Explicit local prototype audio

**Prototype → selected independent frame → Prototype audio** attaches a local WAV through a guarded picker. Choose/Replace, Remove, Loop and Volume are real saved edits with Undo/Redo. Files are read with actual byte progress and cancellation; validation finishes before the frame changes. The original audio file is not modified or linked by path. No account, URL, microphone, native IPC or font/media service is involved.

This is a **partial UI-35-034 implementation**. It supports explicit playback controls in ordinary steady prototype presentation. It does not implement reaction-triggered audio, autoplay, transition/Motion audio, background audio spanning screens, audio mixing, spatial sound, compressed codecs, recording or native audible acceptance. No app/native build is part of this source pass.

## Safe saved content

Optional `DesignNode.prototypeAudio` stores `kind:'wav-pcm16'`, a canonical embedded data URL, sample rate, channel count, frame count, loop and volume. Absent legacy metadata remains absent; `.oui` versions 1 and 2 are unchanged. Source MCP full-project read/replace and the explicit optional node property retain validated bytes as authorized project data. This does not add an asset service.

Only little-endian RIFF/WAVE format 1 PCM with exactly 16-bit integer samples, mono/stereo and 8,000–48,000 Hz is accepted. Declared byte rate/block alignment, chunk sizes/order/padding, sample count, duration and saved metadata must agree. A local import may contain bounded ancillary chunks; they are skipped without interpretation and stripped into an exact `fmt ` + `data` canonical file. Saved/imported `.oui` audio must already be canonical. RF64/RIFX, compressed, float, extensible, malformed, duplicate/truncated containers refuse. Scripts, metadata references and external audio are never executed/fetched.

Limits are 8 MB input/canonical bytes per clip, 60 seconds, 64 source chunks, eight clips and 16 MB actual repeated WAV bytes per document. Copies count separately even when their strings are equal. A chosen clip allocates at most 16 MB of WebAudio float channels, separately from saved bytes. Conversion fills caller-owned AudioBuffer channel storage in bounded chunks with AbortSignal checks and a ten-second preparation/resume deadline; it does not call `decodeAudioData`. Native/browser memory reclamation timing is not a hard RSS guarantee.

The headless parser and metadata validators run before mutation/derivation and on the final document. Canonical byte validation caches at most four exact immutable data strings under a 24-million-character budget; declared format/settings fields are still checked on every call. Mutable object identity is never a validation proof. Page/node lengths are preflighted before building audio indexes; audio-bearing documents are limited to 100,000 nodes and 64 ancestor levels. Legacy documents without audio retain their prior validation behavior.

Audio belongs to independent Design frames outside components, managed instances and slots. Authoring additionally requires visible unlocked ancestry and Motion closed; affected frame/ancestor Motion tracks refuse. Reusable component conversion/reparenting must remove audio first rather than silently discard it. Ordinary frame/page copies and internal clipboard transfer preserve audio and revalidate aggregate budgets. Cross-workspace or component-owned pastes can refuse atomically.

## Runtime behavior

The active topmost frame/overlay gets an HTML audio control panel. Nothing constructs an AudioContext or starts a voice until a trusted Play activation. Play performs bounded PCM-to-float conversion and connects one source through a gain to the actual audio destination; the saved loop/volume settings are used. Pause closes the voice and remembers the local position. Seek and Restart position pause; a further Play is required. Playback position/error/preparation state never enters the document or Undo.

Navigation, overlays, same-value flow Restart, transitions, changed prototype state/source, hidden window, blur and unmount stop/disconnect/close the owned voice. A later native resume promise cannot resurrect it, start a second voice or overwrite a newer UI operation. Source/session receipts are permanently invalidated across away/back transitions; local operation and draft receipts reject superseded controls while fresh controls recover. WebAudio unavailable/blocked environments show a fixed diagnostic and require a fresh Play. Ordinary prototype video audio is an independent earlier subsystem; this feature does not claim cross-media mixing coordination.

## Exports and privacy

SVG/PNG/JPG/PDF artwork is static and omits prototype audio; the editor and fixed SVG/MCP notices disclose this. Audio bytes never appear in SVG/Artwork markup or inspection summaries. Normal private `.oui` files retain them. Explicit Figma delivery strips audio alongside private comments/annotations. The standalone Bridge validates incoming canonical audio before any Figma mutation and reports its omission; API mocks are not a Figma desktop round trip. Public reusable library publication omits audio with a warning before graph hashing; inbound snapshots containing local audio refuse. No private sample data, path or arbitrary parser text is put into public reports/logs.

## Verification scope

Synthetic WAV fixtures exercise actual RIFF parsing/canonicalization, signed PCM values, aggregate/float budgets, exact declarations, malformed/canonical-base64 rejection, cancellation, metadata persistence/Undo, clipboard/pages and library/Figma/static omission. Real browser checks use the actual AudioContext, destination graph and analyser RMS/running clock after a real user Play; they also cover picker/read cancellation, context/draft receipts, pending resume cleanup and source/history invariance. Those checks prove browser signal generation and lifecycle behavior, not speaker audibility, Mac WKWebView audio output or cross-platform device fidelity.

References: [Microsoft RIFF overview](https://learn.microsoft.com/en-us/windows/win32/xaudio2/resource-interchange-file-format--riff-), [original RIFF/WAVE PCM specification](https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/Docs/riffmci.pdf), and [W3C Web Audio](https://www.w3.org/TR/webaudio/).

Default MCP `read_document` and `read_nodes` inspection omits embedded audio bytes alongside images/fonts; explicitly authorized `includeAssets:true` returns the exact scoped project data. Omitted output is an inspection view, not a valid replacement document.
