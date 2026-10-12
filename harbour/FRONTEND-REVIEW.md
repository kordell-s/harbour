# Frontend layout review — 5 October 2026

Scope: live local preview; homepage, broker dashboard, intake, application detail, officer review, verification and pre-submission review. Measured at 320, 390, 768, 1024 and 1440 CSS pixels. Additional visual checks covered desktop cards and intake, the 320px homepage and populated tablet intake fields. This is a layout review, not a complete accessibility or cross-browser audit.

## Findings, in priority order

1. **Small-phone navigation wraps unevenly.** At 320px, Discover, Broker portal and Officer review occupy one row while Verify sits alone underneath. Link targets measure about 36.6px high. Use a deliberate two-by-two layout at the narrowest breakpoint or another compact navigation treatment, with at least 44px-high targets.
2. **Application-card actions do not align.** Equal-height dashboard cards place their actions according to content length. At 1024px, the Solstice action ends roughly 207px above Azure's action, leaving a large empty area beneath it. Use flex-column card bodies and push the primary action to the bottom. Keep status content naturally sized.
3. **Document controls have no separation.** The file input and “Use sample registration & insurance” button have a measured zero-pixel vertical gap. Add 12–16px spacing and style the native file-selector button consistently with the surrounding controls. Preserve the distinction between selecting filenames and using fictional samples.
4. **The smallest homepage needs a more restrained type scale.** At 320px, the fixed 52px hero heading breaks into four oversized lines. The geographic caption also runs close to the image edge. Use a fluid mobile heading size and allow the caption to wrap with comfortable side padding, while retaining the coastal image and serif accent.
5. **Mobile workspace introductions are too tall.** The multi-line prototype notice, spaced eyebrow, large title and actions consume much of the first viewport before the attention queue begins. Reduce vertical spacing and heading size on small screens; keep the fictional-data notice visible and readable.

## Positive checks

- No horizontal page overflow was detected in the 35 route/viewport combinations.
- Populated crew fields at 768px remained within the page and measured approximately 184px wide.
- The restrained teal palette, photography, rounded panels and form styling remain consistent.
- Departmental status and visit-date validity are displayed separately.

## Recommended next pass

Fix the five items above as a focused CSS polish pass. Preserve the current workflow and visual identity. Recheck narrow navigation, aligned card actions and document spacing, then repeat the route/viewport scan. No product code was changed during this review, and the user's open intake form was left intact.
