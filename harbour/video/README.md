# Harbour stakeholder demo video

60-second captions-only stakeholder pitch, 1920 × 1080, 30 fps, H.264 MP4. No voiceover, music or audio track. Includes the broker workspace, Customs, Immigration passport review, government e-pay simulation, receipt reconciliation and issued-copy history.

## Deliverables

- `output/harbour-stakeholder-demo.mp4`: final video.
- `output/harbour-stakeholder-demo-poster.png`: cover image.
- `captions.srt`: companion captions with exact timings.
- `src/index.tsx`: editable Remotion composition, `HarbourStakeholderPitch`.
- `STORYBOARD.md`: pitch structure and editorial boundaries.
- `public/stakeholder-captures.json`: screenshot provenance.

## Edit and render

```sh
npm ci
npm run studio
npm run check
npm run render
npm run verify
```

The current renderer uses Google Chrome at its standard macOS installation path in `remotion.config.ts`. On another platform, remove that override to let Remotion use its supported browser, or set your local executable. The verification script uses Remotion's bundled macOS ARM ffmpeg/ffprobe; use equivalent local tools on another platform. Dependencies are pinned in `package-lock.json`.

All required images are included: render without recapturing the app. New stakeholder captures were collected with browser automation from an isolated local session using fictional demo records. `capture.cjs` is the legacy broker-only capture script; it does not regenerate the new stakeholder captures. Capture selectors, dimensions and app revision are in the provenance JSON.

All animation is driven by Remotion frames. Scenes are sequential and opaque; typography, notes, panels and captions occupy separate regions. Whole screenshots use contain sizing without panning or cropping field labels. Scene review includes every screen state and adjacent transition frames.

## Pitch boundaries

The prototype retains broker-led preparation and independent authority review. Captured passport information supports officer review; identity checks do not grant admission. E-pay is simulated, collects no money and accepts no real card data. Example amounts are fictional, not current government tariffs. Receipts need explicit authority verification; payment never issues a permit or grants clearance. Issued copies and reported delivery records remain in the visit history. No message is sent by recording delivery.

The closing card labels the prototype and links to the actual stakeholder demo. No endorsement, live government integration, official document validity or productivity statistic is claimed. All people, passport references and payment references are fictional.

## Asset credit

Coastal photo by **Roy Googin**, [Anguilla aerial view, western portion](https://commons.wikimedia.org/wiki/File:Anguilla-aerial_view_western_portion.jpg), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Existing Harbour asset `coast.webp`, cropped/compressed; video adds a colour overlay and animated framing. Attribution appears in the end card.

## Verification

Run TypeScript checking, `node render-review.cjs` for review stills, then render and verify the exported MP4. Verification confirms 60 seconds, 1920 × 1080, 30 fps, H.264, 1,800 decoded frames and no audio stream; it also extracts final-video stills for visual inspection. The prior broker MP4 is preserved separately in the working project's output folder.
