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

## Government workspaces — 16 October 2026

`dist/government.js` and `dist/government.css` add dedicated Customs and Immigration queues and visit files. Navigation: `#customs`, `#immigration`, `#epay`. Open the populated North Star record (`gov-demo`) for the connected presentation. The original generic review remains available for other process records.

Customs displays submitted vessel, representation, voyage, document, assessment and receipt evidence. Immigration displays the submitted crew/guest manifest with passport number, issuing country, issue/expiry dates, private version-bound identity checks and separate arrival/departure outcomes. Passport date observations are informational and do not decide eligibility. Broker intake, submission review and CSV manifest include the added passport fields. No passport images or document contents are uploaded.

E-pay is a local simulation. It reads current Customs cruising fee assessments; the fictional amount is not a tariff. Success adds unverified linked receipt evidence. Decline/cancellation adds a retryable attempt without a receipt. Existing evidence reserves its amount to prevent duplicate payment; partial evidence reduces the remaining amount. Superseded requests cannot be paid. Customs verification and document issuance remain explicit, independent actions. Downloaded demo receipts contain payment references, not passport details.

All records remain in memory and reset on reload. Team selection is UI simulation, not authentication or access control. Public verification excludes passport information, private identity review notes and payment transactions. Real use requires authenticated roles, protected storage, operational validation and an approved payment integration.

## Passport scan import — 28 October 2026

`dist/manifest-import.js` turns emailed passport scans into manifest rows. In a broker application, **03 · Crew & guests → Import from passport scans** accepts images and PDFs (several pages, several passports per page). Each page is read in the browser with Tesseract.js (and pdf.js for PDFs), both loaded from CDNs on first use; scans are never uploaded and images are discarded when the panel closes.

Each page is found with a whole-page read, then each passport's machine-readable zone (MRZ, ICAO 9303 TD3) is cropped, enlarged and read twice more (contrast-stretched, and black and white). The three reads are voted field by field: a value needs two reads behind it, and the MRZ check digits must pass. Check digits miss about one in ten multi-character misreads and names have none, which is why agreement is required. When reads disagree, or agree on a passport number that fails its check digit, the number printed elsewhere on the page decides it: an exact printed word, or a printed token within two characters of a read that satisfies the MRZ check digit. MRZ text is excluded from the printed text so it can never confirm itself. Dates and check digits convert letter misreads to digits; passport numbers and names are never guessed.

The printed page also supplies place of birth and issue date (not in the MRZ), found under their labels in several languages and always marked "from printed page" for checking. Plausibility checks flag future or implausible birth dates, expiry more than ten years ahead, unknown country codes and names that fill the MRZ line (possibly shortened), and note minors. Verified people start ticked; everything else is highlighted, starts unticked and shows the cropped MRZ strip for comparison. On the fictional samples, 69 of 72 fields are filled correctly and the remaining 3 are left blank; none is wrong. Pages are retried upside down, slightly tilted and sideways. Manifest rows now hold family and given names separately (older single names are split at the last space), plus sex, place of birth and crew rank.

## Crew and passenger lists

`dist/manifest.js` generates arrival crew and passenger lists laid out after IMO FAL Form 5 (crew list) and Form 6 (passenger list) at `#manifest/:id`, linked from the broker visit page and the Immigration desk. Brokers see their latest saved draft; officers see the submitted version. A completeness check lists anyone missing a detail either list needs. Ports of embarkation and disembarkation default to the voyage's previous and next ports; IMO number and call sign are not collected. Lists print (A4 landscape), download as standalone HTML, or export as CSV. They are labelled as fictional demo documents, not official forms.

`tools/specimens.py samples` regenerates the fictional scans in `dist/samples/` (generic design, SPECIMEN watermark, fictional people). `tools/specimens.py stamp IMAGE ... [--box X0,Y0,X1,Y1]` overlays a valid MRZ on an AI-generated mock passport, whose own MRZ text is usually invalid. Requires Python with Pillow and the macOS Menlo font.

Not yet covered: ID cards and visas (TD1/TD2/MRV formats), HEIC photos in browsers other than Safari, an optional AI fallback for pages with no readable MRZ, email forwarding straight into Harbour, and arrival/departure variants of the lists.
