# Harbour — Codex handoff

## Product and user intent
Standalone web app for yacht brokers handling applications on behalf of yachts visiting Anguilla. Proposed reviewers: Immigration, Customs and Inland Revenue. Brokers complained about repeated manual form entry and approvals. The core concept is online application, independent departmental reviews, digital issuance and QR/reference verification on land.

## Design
Preserve the modern Anguilla tourism homepage, actual coastal imagery, restrained teal palette, rounded Airbnb-inspired cards and controls. Harbour is a working name. Photo credit and licence are in the footer.

## Current source
Plain HTML/CSS/JavaScript in dist/. No dependencies or build required.
Run locally: python3 -m http.server 8000 --directory dist
Open http://localhost:8000

Routes: #home, #dashboard, #intake, #visit/1, #review/1, #verify/HBR-DEMO-1003.
Implemented: broker applications, sample document filenames, crew/guest entry, draft CSV manifests, independent department decisions with reasons, correction requests, resubmission, activity records, approval withdrawal, date validity and verification.

## Important prototype limitations
All records and decisions are fictional, with no legal validity. State is in browser memory and resets on reload. No backend, login, authenticated officer roles, real document storage, payments, official submissions or integrations. QR images link to the existing hosted demo and seeded records; cross-device scans do not reflect session edits. New applications use a generic QR search page. app.js contains earlier functions plus replacement functions; refactor cautiously before extending.

## Existing hosted pitch demo
https://harbour-anguilla.kordellsmith08.chatgpt.site
This export is independent source; it does not transfer the hosting project or its access controls.

## Discovery still needed
ATB and brokers can supply forms and process information. Confirm specific approval types, authorised issuers, required fields, dependencies, fees, amendment/revocation rules and each department's scope. Do not imply endorsement or replace authority decisions with automatic approvals.

## Suggested next work — requires scoping with user
Refactor prototype cleanly while preserving appearance; then propose durable shared records, broker tenancy, real officer access boundaries, document uploads, audit trail and dynamically generated QR records. Do not build speculative integrations or switch hosting without user direction.

## Prompt to start in Codex
Read HANDOFF.md and inspect dist/. Continue development of this existing Harbour MVP. Preserve the Anguilla-inspired homepage and broker-led application flow. First explain the current architecture and propose the smallest next implementation step; do not rebuild from scratch.

## Local continuation — October 2026

The exported source is restored under `harbour/`. The first maintenance pass removed superseded `home`, `dashboard`, `renderCards`, `detail` and `render` functions, removed the redundant intake alias, and placed hash routing registration at startup. Active screen markup, styles, imagery and broker-led decision semantics are preserved. The earlier limitation about replacement functions above is now resolved for route renderers.

See `README.md` for run instructions, architecture and prototype limits. Run `node --test tests/workflow.test.cjs` from `harbour/` for regression checks. State remains session-only, and no hosting changes or integrations were made.

The approved frontend review fixes are now applied: broker-oriented intake copy, prominent date validity beside departmental status, responsive toolbar/header adjustments, compact mobile statistics and active navigation with `aria-current`. Approval and resubmission rules remain unchanged. The live preview was checked at 390px and 635px; all nine workflow regression tests pass. Full rendered-markup parity against the original export is no longer expected after these intentional UI changes.

## Stakeholder-demo milestone — 5 October 2026

Added a broker attention queue, session-only drafts, a review-before-submission screen with illustrative completion checks, visible correction requests and broker responses, versioned activity events, explicit officer decision selection, and a reset confirmation screen. Saving a draft never changes a submitted record. Only confirmed submission increments the version and resets departmental decisions. Drafts are excluded from officer review and public reference verification.

Starting examples: Azure needs a Customs correction; Solstice is an incomplete draft; Sea Glass has departmental approvals. The sample-document button adds fictional filenames without an upload. See `DEMO-GUIDE.md` for the presentation sequence. The prototype still uses browser-memory state and the original static QR assets; no backend, deployment or official integration was added.

## Process-alignment milestone — 5 October 2026

This section supersedes earlier descriptions of mandatory three-department approval and blanket resubmission resets. Visits now have separate inward/outward Customs and Immigration records, conditional cruising/marine-park permissions and conditional IRD work. Broker movements and assessed-payment receipts are separate from simulated authority outcomes. New intake fields capture vessel use, cargo, tonnage, registry, owner/agent, voyage and activities. Applicability and live rules remain unconfirmed where appropriate.

No global Approved outcome remains. Public verification shows individual process scopes, references and permit windows. Old static QR assets remain in the export but are not displayed. Amendments preserve evidence and flag existing outcomes for review; cancellation/reissue is per process. See the rewritten README and DEMO-GUIDE for the current behavior.

## Manual-form evidence — 8 October 2026

Reviewed the user's clearance PDF, permit image, fee-amendment image and government permit link. Saved `MANUAL-PROCESS-MAPPING.md` with an implementation-ready field and process comparison. The 2022 government regulations corroborate the photographed fee table; do not continue using the 2010 tariff as the newest evidence. Proposed next slices: structured process-specific applications, linked assessments/receipts, and versioned printable demo documents. Separate applicant, owner and agent; retain authority issuance; address cruising validity times. No application changes in this evidence-review turn. Do not seed the real identities or signature from the supplied clearance scan.

## Document-pack implementation — 8 October 2026

Implemented the approved mapping within the existing vanilla app. New `dist/documents.js` provides structured cruising/clearance drafts, versioned requests, manual assessments/exemptions, linked receipts and explicit authority verification, frozen demo issuance snapshots, print/HTML download and broker-reported delivery history. The visit page links to the pack; authority actions remain separate UI simulations. The module loads before `app.js`; the test harness loads both.

Cruising start validity is time-aware (09:00 Anguilla); issue-date endpoints are still manually confirmed. Registry seed values now use port names. Identity mismatches require visit amendments; requests bound to old visit versions cannot issue; cancellation remains visible after reissue. No live payment, official signature, document upload, authentication or backend was added. See README and DEMO-GUIDE for operation and limitations.

Verification: JavaScript syntax checks and 33 workflow tests pass. Browser-tested cruising assessment/receipt verification/issuance, clearance issuance, delivery logging and printable-copy download. Document pack, authority desk and issued-copy layouts had no horizontal overflow or duplicate IDs at 390, 768 and 1440 pixels. The embedded browser did not expose its native print dialog, so the standalone HTML download is the tested fallback; PDF pagination was not separately verified.

## Broker pitch video — 11 October 2026

Created a separate Remotion project under `video/`. The user chose captions only. The 60-second landscape composition uses actual app-rendered screens with isolated fictional fixtures, Harbour's existing coast asset and teal styling. Story: broker attention queue, reusable preparation, separate authority reviews, linked receipt verification, preserved issued copies, and an invitation to a walkthrough. It identifies the prototype and simulated authority actions. Product source and existing browser-session records were not changed. See `video/README.md` for editing, rendering and asset attribution.


## Government desks and e-pay — 16 October 2026

User approved dedicated Customs and Immigration information views, including captured passport data, plus a government e-pay simulation. Stakeholders should see populated information and decision states without having to complete a workflow. Implemented in `dist/government.js` / `government.css`, loaded alongside the existing vanilla JS app. North Star (`gov-demo`, `HBR-DEMO-GOV`) is a fourth fictional example with a submitted cruising request, current assessment, three manifest entries, a checked private identity review and a passport-date observation.

Routes: `#customs`, `#customs/:id`, `#immigration`, `#immigration/:id`, `#epay`, `#epay/:id`, `#epay/:id/:assessmentId`. Broker intake/review/export now include passport issuer, issue date and expiry date in addition to the existing passport number. Person review records are keyed to submission version and captured identity. No passport images or document contents are stored. Public verify keeps private identity/review/payment fields out.

E-pay reads current Customs cruising assessments, simulates success/decline/cancellation, creates linked unverified receipt evidence on success, prevents duplicate/stale payments and accounts for partial receipt amounts in cents. Explicit Customs verification is still required before the existing cruising issuance gate passes. No live payment processor, fees calculator, authentication, persistent storage or official government branding was added.

Verification: 46 Node workflow tests; browser checks of private passport note save, scoped Customs outcome, declined→successful payment, downloaded receipt and separate Customs verification. Six government routes checked at 390/768/1440 px with no horizontal overflow or duplicate IDs. Expanded decision date fields were additionally checked and changed to a single column in the narrow rail. Independent review found a new-visit store initialization bug, now covered by a regression test and fixed. Superseded receipt controls and downloaded verification status were corrected.

Changes are prepared locally for review; the production deployment has not been updated by this implementation task.
