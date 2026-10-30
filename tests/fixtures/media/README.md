# Synthetic media fixtures

Both clips are generated locally: 64 × 40 pixels, ten video frames, red for 0.5 seconds then blue for 0.5 seconds, with a 440 Hz synthetic sine tone. No external or user content is included. Container metadata gives a finite duration (about one second).

Generated with ffmpeg using three lavfi inputs, the two colors concatenated, and the tone mapped as audio:

```sh
ffmpeg -f lavfi -i 'color=c=red:s=64x40:r=10:d=0.5' -f lavfi -i 'color=c=blue:s=64x40:r=10:d=0.5' -f lavfi -i 'sine=frequency=440:duration=1' -filter_complex '[0:v][1:v]concat=n=2:v=1:a=0[v]' -map '[v]' -map 2:a -c:v libvpx -b:v 60k -c:a libopus -shortest red-blue.webm
ffmpeg -f lavfi -i 'color=c=red:s=64x40:r=10:d=0.5' -f lavfi -i 'color=c=blue:s=64x40:r=10:d=0.5' -f lavfi -i 'sine=frequency=440:duration=1' -filter_complex '[0:v][1:v]concat=n=2:v=1:a=0[v]' -map '[v]' -map 2:a -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart -shortest red-blue.mp4
```

The animated GIF uses the same red/blue lavfi color inputs at two frames per second, concatenated into one second with `-loop 0` and no audio. It is used to verify actual animated canvas/prototype pixels rather than only testing an image URL or metadata.
