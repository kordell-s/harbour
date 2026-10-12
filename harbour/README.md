# Harbour MVP

A broker-led yacht visit coordination demo for Anguilla. All records are fictional, session-only and have no legal validity.

## Run

From this directory:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. No build or application dependencies are required.

## Architecture and workflow

`dist/index.html` supplies navigation and the footer. `dist/style.css` preserves the coastal design. `dist/app.js` contains the hash routes, renderers, sample records and lifecycle validation.

A visit has an editable draft, submitted version, separate authority process records, broker-reported movements, receipts and activity history. Processes include Customs inward/outward clearance, Immigration arrival/departure review, conditional cruising and marine-park mooring permissions, and conditional IRD tax/licensing work. Applicability can remain unconfirmed; there is no universal three-department approval gate.

Drafts do not alter submitted records and are excluded from public verification and officer review. Confirmed amendments retain previous outcomes and flag existing records for review under a conservative, explicitly illustrative demo rule. Cancellation is process-specific; reissue requires a new reference. Prior process snapshots remain accessible in the private activity timeline.

Public verification displays each process and its scope. It omits passenger identities, private reasons and receipts. Old static QR images are not displayed because they point to an earlier hosted demo.

## Test

Requires Node.js with its built-in test runner:

```sh
node --check dist/app.js
node --test tests/workflow.test.cjs
```

The minimal DOM harness tests process independence, conditional applicability, permit dates, marine prerequisites, draft isolation, amendments, cancellation/reissue, receipts, departure checks, privacy and reset. It is not a browser layout or authentication test. The optional `HARBOUR_BASELINE` comparison belonged to the earlier behavior-preserving refactor and is no longer part of the current suite.

## Demonstration and research

- `DEMO-GUIDE.md`: presentation walkthrough.
- `PROCESS-RESEARCH.md`: published sources and unresolved operational questions.
- `FRONTEND-REVIEW.md`: earlier layout findings; unrelated recommendations have not all been implemented.

No backend, authenticated roles, real document storage, payments, government integration or live shared QR service exists. Requirements and current fees need confirmation before production use. Reloading clears changes; Reset demo also restores the initial examples after confirmation.

## Document workflow — 8 October 2026

`dist/documents.js` loads before the app and adds process-specific requests, authority assessments, linked/verified receipt evidence, immutable issuance snapshots and delivery events. Open a visit's **Document pack**. Routes: `#documents/3`, `#document-review/3`, and `#document/3/REQ-1` or an issued `DOC-*` reference within the current session.

Cruising and outward-clearance drafts have independent completeness checks. Applicant, owner and appointed agent are distinct. Flag-country selection is retained. Shared details are reused from the submitted visit and current requests, but document editing never changes a submitted visit. Vessel identity changes require a visit amendment first.

The authority desk uses manually entered assessments; there is no automatic tariff calculator. A cruising document requires a recorded exemption or enough verified linked receipts. Payment evidence alone cannot issue a document. The older visit-level receipt recorder remains available for other charges; those entries cannot satisfy the document-pack payment gate.

Issued copies freeze application, assessment and receipt data. Amendments flag review, and cancellation remains visible after reissue. Cruising validity now uses 09:00 commencement and end-of-day expiry in Anguilla time. Calendar-period expiry remains officer-confirmed. All rules remain demo behavior pending operational validation.

Document pages have print styling and a downloadable standalone HTML copy. Use a regular browser's print dialog to save that copy as PDF if embedded printing is unavailable. No real signature/stamp is reproduced. Private document routes are UI separation only, not access control; authentication and storage remain absent. Reloading clears document records along with other demo changes.
