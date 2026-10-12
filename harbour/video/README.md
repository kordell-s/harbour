# Harbour broker demo video

60-second captions-only pitch, 1920 × 1080, 30 fps, H.264 MP4. No voiceover, music or audio track. Designed for broker presentations and landscape video sharing.

## Deliverables

- `output/harbour-broker-demo.mp4`: final video.
- `output/harbour-broker-demo-poster.png`: cover image.
- `captions.srt`: optional plain-text caption timing.
- `src/index.tsx`: editable Remotion composition.
- `STORYBOARD.md`: narrative and source rationale.

## Edit and render

```sh
npm ci
npm run studio
npm run render
```

The current renderer uses Google Chrome at its standard macOS installation path in `remotion.config.ts`. On another platform, remove that override to let Remotion use its supported browser or set your local executable. Versions are pinned in `package-lock.json`.

The video uses screenshots captured from the actual local Harbour prototype, with staged fictional data. All animation is driven by Remotion frames. To regenerate UI captures after app changes, run `npm run capture` from this directory; that script needs the app in `../dist/`. Captures are included, so the video can be rendered without recapturing the app.

The project does not change the product's code, contact authorities or send messages. The pitch makes no numerical time-saving claims and identifies simulated authority actions. The closing invitation intentionally contains no invented contact details.

## Asset credit

Coastal photo by **Roy Googin**, [Anguilla aerial view, western portion](https://commons.wikimedia.org/wiki/File:Anguilla-aerial_view_western_portion.jpg), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Existing Harbour asset `coast.webp`, cropped/compressed; video adds a colour overlay and animated framing. Attribution appears in the end card.

## Verification

TypeScript check; scene-by-scene rendered-frame inspection; final MP4 metadata and decode checks. No native app or browser session data was recorded. All people, references and financial values shown are fictional examples from the local demo.

## Layout revision

Callouts use a dedicated 435 px left column, separated from product screenshots. Global border-box sizing keeps padding inside the assigned bounds. Scene durations do not overlap, preventing double-exposed text during transitions. Headings, supporting copy and captions retain separate vertical regions. Rendered review frames cover all seven scenes plus transition samples.
