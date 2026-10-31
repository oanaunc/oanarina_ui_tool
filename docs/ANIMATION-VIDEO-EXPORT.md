# Animation video export

**Motion → Export animation** writes MP4 and WebM through WebCodecs when the engine has it, and through the older real-time MediaRecorder path when it does not. GIF is unchanged.

## How a file is made

Each frame is sampled at an exact time, drawn to a canvas, and encoded with a timestamp computed from its index. Drawing time no longer matters, so a slow shader frame cannot drop or stretch anything. The exporter checks that the encoder returned every frame and that the file holds that count. A looping timeline stops one frame short of the seam; a non-looping one lands its last frame on the end time.

`src/video-mux.ts` is a small dependency-free writer for both containers. MP4 uses a fast-start layout with one sample table per track. WebM has a known segment size, a duration and a Cues index, so it seeks without a remux.

| Format | Video | Audio |
| --- | --- | --- |
| MP4 | H.264 High, realtime mode, then Baseline | AAC-LC 48 kHz stereo |
| WebM | VP9, then VP8 | Opus 48 kHz stereo |

H.264 output is padded to even dimensions, because the codec requires them. Video files have an opaque white background.

## An encoder that never answers

On WKWebView, H.264 High and Main in `quality` latency mode pass `isConfigSupported`, accept every frame, and then never return one or finish `flush()`. Nothing reports this, so `src/animation-video.ts` watches for it: if no frame has come back by frame 12, or output stops for six seconds, that configuration is abandoned and the next candidate redraws from the start. If every candidate stalls, a silent export falls back to MediaRecorder and an export with a soundtrack stops with an error.

## Sound

Choose a soundtrack in the export panel, either the prototype audio attached to a selected frame or its ancestor, or any canonical PCM16 WAV through **Choose WAV…**. A picked file lasts for the session and never enters the document. Sound is mixed to 48 kHz stereo: mono feeds both channels, saved loop and volume apply, a shorter clip ends in silence, and a longer one is cut at the end of the animation.

Audio needs `AudioEncoder`. Where it is missing, the panel says so and export with sound is refused rather than silently dropped.

## Limits

- Embedded video layers export their poster frame and their audio is not read.
- There is no alpha channel in video.
- AAC encoder priming is not compensated with an edit list, so audio can start up to about 45 ms late in MP4.
- The real-time fallback can still drop frames on older WebKit. It only runs where WebCodecs is missing or every encoder stalled.
- Limits stay at 1,800 frames, 4,096 px per edge and 8 megapixels.

## What was tested

- `tests/e2e/animation-video.spec.ts` runs the real panel in Chromium and in Playwright WebKit, and checks codec, frame count, duration, pixels at given times and decoded audio level with ffprobe and ffmpeg.
- A separate harness ran the encoders inside a real system `WKWebView` on macOS 27 and verified both files with ffprobe: 60 H.264 frames with AAC, and 60 VP9 frames with Opus. That harness is not in the repository and did not exercise the packaged app.
- Older macOS WebKit was not tested. Its WebCodecs and encoder availability differ, and the fallback paths above are the design for it, not a verified result.
