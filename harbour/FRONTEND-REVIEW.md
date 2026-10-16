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


## Government stakeholder demo polish — 16 October 2026

Scope: Customs and Immigration queues/visit files, captured passport reviews, government e-pay assessments, expanded controls and payment outcomes. Preserve Harbour's coastal identity and independent authority decisions.

| Before | After | Why |
| --- | --- | --- |
| Six header links wrapped across phone rows | Native disclosure menu on phone/tablet; full desktop navigation retained | Keeps all destinations available and reduces header height |
| Workspace tabs wrapped to a second row | Three compact mobile tabs | Stable orientation without horizontal clipping |
| Repeated context, notices and headings dominated the screen | Shorter notice and compact visit-file headings | Brings operational information forward |
| Payment review mixed primary reference details with all supplementary fields | Core assessment summary plus expandable assessment details | Keeps the charge clear and shortens the path to payment controls |
| Activity metadata could overflow with an unbroken agency name | Inherited anywhere wrapping in government workspaces | Long identifiers remain readable inside their panels |
| Narrow result columns and small disclosure/link targets | Single-column phone result details and 44 px disclosure/link targets | Improves legibility and touch use |
| Tall sticky sidebars could extend beyond short laptop screens | Normal page flow except sufficiently tall desktop viewports | Keeps decision controls reachable |
| Toast text could wrap into a narrow floating block | Intrinsic-width, bounded, non-blocking feedback | Avoids obstructing touch controls |

Verification: 46 workflow tests pass. Browser review covers all six main government routes at 320, 375, 390, 600, 768, 900, 901, 1024, 1101, 1280 and 1440 px. Additional checks cover expanded passport/decision/assessment forms, short (600 px) viewports, cancelled/declined/successful payments, empty search results, long names and references, and keyboard menu dismissal/navigation. No horizontal overflow, overlapping layout siblings, duplicate IDs or out-of-container controls remain in the checked states. The 375 px Customs queue starts approximately 340 px higher than before.

Verification uses responsive browser viewports; physical iOS/Android keyboard, safe-area and touch behavior was not tested on hardware. Identity, payment and approval workflow rules are unchanged.
