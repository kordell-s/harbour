# Paper processes to Harbour workflows

Evidence reviewed: 8 October 2026. This is a product specification, not a statement of current operational acceptance. No application code changed in this review.

## Evidence

- User-provided `Scan_0002-5.pdf`: one scanned, completed Customs clearance certificate. Visually reviewed; no searchable text. Includes personal details and a signature. Keep the source outside the demo and use fictional examples. Its destination field suggests outward clearance; confirm its exact use with Customs.
- User-provided photo `WhatsApp Image 2026-10-08 at 14.47.40 (1).jpeg`: Cruising Permit (Amendment) Regulations 2015, R.A. 31/2015. The displayed commencement is 1 January 2016.
- User-provided photo `WhatsApp Image 2026-10-08 at 14.47.40.jpeg`: blank permit, matching the [linked government form](https://www.gov.ai/document/forms/customs/Customs_Cruising%20Permit.pdf). This is an issued-permit template, not the application form.
- Newly located [government consolidation as at 31 December 2022](https://gov.ai/Legislation/Regulations/C165-Cruising%20Permit%20Regulations.pdf) includes separate application, fee and issued-permit schedules. Its fee table matches the supplied photograph. It is newer than the 2010 copy used in the earlier research, but does not establish whether later changes exist.

Source instructions about copies and signatures describe the paper process. They do not instruct Harbour to submit documents, copy signatures or issue real permissions.

## Core product change

Use one reusable vessel and party record to prepare distinct applications and certificates. Keep requested details, assessed fees, evidence of payment, authority decisions and issued documents separate. Preserve the existing design and broker-led preparation.

Proposed cruising workflow:

Broker prepares request → reviews application snapshot → submits → Customs reviews or requests corrections → authority records assessment or exemption → receipt evidence is linked and verified → authority issues a versioned permit → broker delivers/downloads a copy.

This is a proposed coordination sequence; officers must confirm payment and issuance ordering. Submission, payment and document generation must never automatically grant permission. Application status, payment status and permit status should remain independently visible.

## Field mapping

| Paper information | Existing Harbour support | Proposed change |
|---|---|---|
| Applicant name and address | Broker name only; applicant identity is not distinct | Separate applicant fields and explicit role; offer deliberate reuse of owner/agent details |
| Owner name and address | Owner name | Add owner address |
| Owner's agent name and address | Broker name, agent address and telephone | Separate owner's appointed agent from the person entering the application |
| Boat name and port of registry | Present | Reuse in both document types without retyping |
| Registered tonnage | One numeric value | Record tonnage type and documentary source; do not assume the clearance's “tons burthen” means the same measure |
| Permit period and commencement | Officer validity dates only | Add requested duration and start date to broker application; retain issued dates independently |
| Permit expiry | Officer date available | Show suggested dates for review, then freeze authority-confirmed dates in issued version |
| Fee paid and official receipt | Receipts exist at visit level | Link each receipt to an assessment and specific process; distinguish broker evidence from authority verification |
| Permit number, issuing officer and stamp | Process reference and typed officer name | Add explicit issuance event and immutable document snapshot; prototype outputs visibly marked as demo |
| Clearance port and master | Arrival port and captain | Capture clearance-issuing port separately; reuse captain after broker confirmation |
| Clearance vessel construction | Missing | Add construction material/description |
| Clearance crew and people aboard | Manifest roles available | Derive separate crew and guest counts; show the manifest version and allow reconciliation |
| Clearance destination | Free-text next destination | Split destination port and country; keep movement separate from clearance issuance |
| Clearance date and attestation | Generic outcome timestamp | Add certificate issue date/place and authority evidence, distinct from actual departure |

Additional application fields identified in the newer Schedule 1: vessel description, power/sail, rig, colour, owner status, application date and applicant signature. Proposed demo: collect those details in a conditional permit section, with a declaration preview and signing status rather than treating a typed name as a legally accepted signature.

## Fee schedule evidence

Transcribed from the user's 2015 amendment photograph; values corroborated by the 2022 consolidation. The photograph labels currency only with `$`.

| Period | Up to 5 tons | 5 to 20 tons | Over 20 tons |
|---|---:|---:|---:|
| One day | 110 | 225 | 560 |
| One week | 410 | 1,125 | 2,250 |
| One month | 1,050 | 3,375 | 4,500 |
| Three months | 2,100 | 9,000 | 12,750 |

Proposed fee model: versioned schedule, source, effective dates, confirmed currency, tonnage basis, duration, assessing authority, assessed amount, exemption/reason and linked receipt(s). Retain the exact assessment on each application so future schedule changes do not rewrite past records.

The 2022 text includes a locally-owned-boat fee exemption and calendar-based durations. It specifies a 09:00 start and midnight expiry. Confirm current applicability, currency, exact 5-ton boundary, tonnage basis, exemption evidence and calendar expiry convention before enabling authoritative calculations. A checkbox for local ownership should request review, not award an exemption.

## Issued documents and paper transition

The linked permit records parties, vessel, validity, payment and issuing-officer attestation; it calls for three copies and delivery of the original to the applicant or agent. Preserve a printable transition path while proposing a controlled digital original with delivery history. Obtain authority agreement before treating digital distribution as satisfying paper requirements.

Proposed output states: draft application, submitted application snapshot, demo permit, and demo clearance certificate. Freeze vessel, parties, scope, validity, assessment link and issuer at issuance. Later amendments create a new version; canceled documents retain their history. Do not reproduce the real signature or stamp from the supplied scan.

Public verification should expose only a specific document's reference, vessel, scope, status and validity. Applicant/owner addresses, manifests, signatures and receipt details belong in private views. A verification code needs durable shared storage before it can be relied on across devices.

## Corrections to existing assumptions

- Current `processValidity` uses whole dates. Cruising-permit validity needs authority-confirmed time boundaries; a generic date-only badge can label a permit active before its start time.
- The registry-port sample currently repeats flag-country values. Port of registry and flag country must remain distinct in examples and input guidance.
- A visit-level receipt with free-text purpose does not establish that a particular permit fee has been settled.
- A submitted visit is not itself a submitted cruising application. Use process-specific completeness checks so missing permit details do not prevent an unrelated visit draft.
- An issued permit template and a broker application need different actions and permissions.
- Retain independent Immigration records: the permit does not itself establish a person's right to enter.

## Recommended implementation slices

1. **Structured preparation:** conditional cruising application section, distinct parties, vessel description, requested period/start, and outward-clearance data. Reuse known data and show missing items beside each document.
2. **Assessment and review:** process-linked assessments, exemption review, receipt verification and correction requests. Start with manually confirmed values; add a clearly labelled schedule-based estimate once calculation rules are confirmed.
3. **Document pack:** printable fictional application, permit and clearance previews, with separate issuance controls, frozen versions and delivery history. Preserve the professional Harbour styling; avoid copying the visual clutter of the paper forms into intake.

Suggested demo narrative: enter the yacht once, prepare the cruising request, correct one field, record assessment and receipt evidence, simulate Customs issuance, then prepare outward clearance using the same vessel and manifest. Show separately what the broker prepared, what the authority decided and what remains outstanding.

## Acceptance checks for implementation

- Changing an applicant does not silently change owner or agent.
- Draft edits do not rewrite submitted applications or issued documents.
- Requested permit dates do not alter issued validity.
- Missing cruising data blocks only that process's submission.
- Payment cannot issue a permit; an exemption requires a recorded authority outcome.
- Tonnage and tariff boundary ambiguity produce a review item rather than a guessed charge.
- Public verification excludes private party and payment data.
- Permit validity uses Anguilla time, including the confirmed start/expiry boundaries.
- Construction and crew/guest counts appear in the clearance preview; no real scan identities/signature enter demo seed data.
- Print output and intake remain usable on desktop and mobile.

## Stakeholder questions

Confirm current form editions; which parties may apply/sign; current tariff and currency; the exact tonnage categories; acceptable local-ownership evidence; calendar expiry rules; who verifies receipts; electronic signature/copy acceptance; clearance certificate use and issuing workflow; and whether the scan's headcounts include the master.
